import type { InferSelectModel } from "drizzle-orm";
import type { dentists } from "@/db/schema";
import { haversineDistanceMiles, parseCoordinates } from "./geo";

export type Dentist = InferSelectModel<typeof dentists>;
export type DentistWithMeta = Dentist & { distanceMiles?: number };

export interface RankingQuery {
  service?: string;
  verifiedOnly?: boolean;
  openNow?: boolean;
  acceptingNewPatients?: boolean;
  sameWeek?: boolean;
  emergencyToday?: boolean;
  weekend?: boolean;
  insurance?: string;
  radiusMiles?: number;
  originCoords?: { lat: number; lng: number };
}

export interface FeaturedConfig {
  maxFeatured: number;
  positions: number[]; // Positions where featured should appear (1-indexed)
}

/**
 * Compute completeness score (0-100) based on filled fields
 */
export function computeCompletenessScore(dentist: Dentist): number {
  let score = 0;
  const maxScore = 100;

  // Basic info (30 points)
  if (dentist.name) score += 10;
  if (dentist.address) score += 10;
  if (dentist.phone) score += 10;

  // Enhanced info (40 points)
  if (dentist.website) score += 10;
  if (dentist.hours && Object.keys(dentist.hours || {}).length > 0) score += 15;
  if (dentist.servicesFlags && Object.keys(dentist.servicesFlags || {}).length > 0) score += 15;

  // Additional data (30 points)
  if (dentist.insurances && dentist.insurances.length > 0) score += 10;
  if (dentist.languages && dentist.languages.length > 0) score += 10;
  if (dentist.verifiedStatus === "verified") score += 10;

  return Math.min(score, maxScore);
}

/**
 * Compute organic ranking score (higher is better)
 * Does NOT include payment/subscription signals
 */
export function organicScore(dentist: Dentist, query?: RankingQuery): number {
  let score = 0;

  // Base completeness (0-100, weighted 40%)
  score += dentist.completenessScore * 0.4;

  // Verified status bonus (30 points)
  if (dentist.verifiedStatus === "verified") {
    score += 30;
  }

  // Service match bonus (20 points per match)
  if (query?.service && dentist.servicesFlags) {
    const serviceMap: Record<string, keyof typeof dentist.servicesFlags> = {
      "emergency-dentist": "emergency",
      "pediatric-dentist": "pediatric",
      "invisalign": "invisalign",
    };
    const serviceKey = serviceMap[query.service];
    if (serviceKey && dentist.servicesFlags[serviceKey]) {
      score += 20;
    }
  }

  // Recency bonus (up to 10 points for recently updated)
  if (dentist.updatedAt) {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(dentist.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate < 30) {
      score += Math.max(0, 10 - daysSinceUpdate / 3);
    }
  }

  // Insurance match bonus (15 points)
  if (query?.insurance && dentist.insurances?.length) {
    const normalizedInsurance = query.insurance.trim().toLowerCase();
    const match = dentist.insurances.some(
      (plan) => plan && plan.trim().toLowerCase() === normalizedInsurance
    );
    if (match) {
      score += 15;
    }
  }

  // Availability signals (10 points each)
  if (query?.acceptingNewPatients && dentist.acceptingNewPatients) {
    score += 10;
  }
  if (query?.sameWeek && dentist.availabilityFlags?.same_week) {
    score += 10;
  }
  if (query?.emergencyToday && dentist.availabilityFlags?.emergency_today) {
    score += 10;
  }
  if (query?.weekend && dentist.availabilityFlags?.weekend) {
    score += 10;
  }

  // Distance bonus (up to 20 points, closer is better)
  if (query?.radiusMiles && query.originCoords && dentist.lat && dentist.lng) {
    const coords = parseCoordinates(dentist.lat, dentist.lng);
    if (coords) {
      const distance = haversineDistanceMiles(query.originCoords, coords);
      const clampedDistance = Math.min(distance, query.radiusMiles);
      const distanceScore = Math.max(0, (1 - clampedDistance / query.radiusMiles) * 20);
      score += distanceScore;
    }
  }

  return score;
}

/**
 * Sort dentists by organic score (descending)
 * Tie-breaker: verified status, then completeness, then name
 */
export function sortDentists(dentists: DentistWithMeta[], query?: RankingQuery): DentistWithMeta[] {
  return [...dentists].sort((a, b) => {
    const scoreA = organicScore(a, query);
    const scoreB = organicScore(b, query);

    // Primary: organic score
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // Tie-breaker 1: verified status
    const verifiedOrder = { verified: 3, pending: 2, unverified: 1 };
    const verifiedDiff = verifiedOrder[b.verifiedStatus] - verifiedOrder[a.verifiedStatus];
    if (verifiedDiff !== 0) {
      return verifiedDiff;
    }

    // Tie-breaker 2: completeness
    if (b.completenessScore !== a.completenessScore) {
      return b.completenessScore - a.completenessScore;
    }

    // Tie-breaker 3: name (alphabetical)
    return a.name.localeCompare(b.name);
  });
}

export interface DentistWithFeatured extends DentistWithMeta {
  isSponsored?: boolean;
}

/**
 * Inject featured dentists into sorted organic list
 * Featured dentists must have active pro/premium subscription
 */
export function injectFeatured(
  sortedDentists: DentistWithMeta[],
  featuredDentists: DentistWithMeta[],
  config: FeaturedConfig
): DentistWithFeatured[] {
  const result: DentistWithFeatured[] = [];
  const featuredSet = new Set(featuredDentists.map((d) => d.id));
  const usedFeatured = new Set<string>();
  let organicIndex = 0;
  let featuredIndex = 0;
  let position = 1;

  // Mark featured dentists
  const featuredWithFlag = featuredDentists.map((d) => ({
    ...d,
    isSponsored: true,
  }));

  // Insert featured at specified positions
  while (organicIndex < sortedDentists.length || featuredIndex < featuredWithFlag.length) {
    // Check if we should insert featured at this position
    if (
      config.positions.includes(position) &&
      featuredIndex < featuredWithFlag.length &&
      usedFeatured.size < config.maxFeatured
    ) {
      const featured = featuredWithFlag[featuredIndex];
      if (!usedFeatured.has(featured.id)) {
        result.push(featured);
        usedFeatured.add(featured.id);
        featuredIndex++;
        position++;
        continue;
      } else {
        featuredIndex++;
        continue;
      }
    }

    // Insert organic dentist (skip if already featured)
    if (organicIndex < sortedDentists.length) {
      const organic = sortedDentists[organicIndex];
      if (!featuredSet.has(organic.id)) {
        result.push(organic);
      }
      organicIndex++;
      position++;
    } else {
      // No more organic, add remaining featured
      if (featuredIndex < featuredWithFlag.length && usedFeatured.size < config.maxFeatured) {
        const featured = featuredWithFlag[featuredIndex];
        if (!usedFeatured.has(featured.id)) {
          result.push(featured);
          usedFeatured.add(featured.id);
        }
        featuredIndex++;
      } else {
        break;
      }
    }
  }

  return result;
}
