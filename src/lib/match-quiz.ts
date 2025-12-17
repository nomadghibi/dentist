/**
 * Patient Matching Quiz Logic
 * Extends existing ranking.ts to provide explainable recommendations
 */

import type { MatchQuizAnswers } from "@/lib/validators/match";
import type { Dentist } from "@/lib/ranking";

// Extend Dentist type to include new Phase 1 fields
// Use Omit to allow optional override of acceptingNewPatients
interface ExtendedDentist extends Omit<Dentist, "acceptingNewPatients" | "availabilityFlags" | "badges"> {
  availabilityFlags?: {
    same_week?: boolean;
    emergency_today?: boolean;
    weekend?: boolean;
  } | null;
  acceptingNewPatients?: boolean | null;
  badges?: {
    anxiety_friendly?: boolean;
    pediatric_friendly?: boolean;
    [key: string]: boolean | undefined;
  } | null;
}

export interface MatchReason {
  code: string;
  message: string;
  weight: number;
}

export interface MatchResult {
  dentist: Dentist;
  score: number; // 0-100
  reasons: MatchReason[];
}

/**
 * Match dentists based on quiz answers
 * Reuses ranking logic but adds explainable reasons
 */
export function matchDentists(
  dentists: ExtendedDentist[],
  answers: MatchQuizAnswers
): MatchResult[] {
  const scored: MatchResult[] = [];

  for (const dentist of dentists) {
    const reasons: MatchReason[] = [];
    let score = 50; // Base score

    // City match (required, but boost if exact)
    if (dentist.citySlug === answers.city) {
      score += 10;
      reasons.push({
        code: "city_match",
        message: `Located in ${answers.city}`,
        weight: 10,
      });
    }

    // Urgency matching
    if (answers.urgency === "emergency") {
      if (dentist.servicesFlags?.emergency) {
        score += 20;
        reasons.push({
          code: "emergency_service",
          message: "Offers emergency dental services",
          weight: 20,
        });
      }
      if (dentist.availabilityFlags?.emergency_today) {
        score += 15;
        reasons.push({
          code: "emergency_available",
          message: "Available for emergency appointments today",
          weight: 15,
        });
      }
    } else if (answers.urgency === "same-week") {
      if (dentist.availabilityFlags?.same_week) {
        score += 15;
        reasons.push({
          code: "same_week_available",
          message: "Can schedule same-week appointments",
          weight: 15,
        });
      }
    }

    // Weekend need
    if (answers.weekend_need) {
      if (dentist.availabilityFlags?.weekend) {
        score += 15;
        reasons.push({
          code: "weekend_available",
          message: "Available on weekends",
          weight: 15,
        });
      }
    }

    // Adult/Child matching
    if (answers.adult_or_child === "child" || answers.adult_or_child === "both") {
      if (dentist.servicesFlags?.pediatric) {
        score += 20;
        reasons.push({
          code: "pediatric_service",
          message: "Specializes in pediatric dentistry",
          weight: 20,
        });
      }
    }

    // Anxiety level
    if (answers.anxiety_level === "high" || answers.anxiety_level === "moderate") {
      if (dentist.badges?.anxiety_friendly) {
        score += 15;
        reasons.push({
          code: "anxiety_friendly",
          message: "Anxiety-friendly practice",
          weight: 15,
        });
      }
    }

    // Insurance match (if provided)
    if (answers.insurance && dentist.insurances) {
      const insuranceLower = answers.insurance.toLowerCase();
      const matches = dentist.insurances.some(
        (ins) => ins.toLowerCase().includes(insuranceLower) || insuranceLower.includes(ins.toLowerCase())
      );
      if (matches) {
        score += 15;
        reasons.push({
          code: "insurance_match",
          message: "Accepts your insurance",
          weight: 15,
        });
      }
    }

    // Language preference
    if (answers.language && dentist.languages) {
      const languageLower = answers.language.toLowerCase();
      const matches = dentist.languages.some(
        (lang) => lang.toLowerCase().includes(languageLower)
      );
      if (matches) {
        score += 10;
        reasons.push({
          code: "language_match",
          message: `Speaks ${answers.language}`,
          weight: 10,
        });
      }
    }

    // Accepting new patients
    if (dentist.acceptingNewPatients === true) {
      score += 10;
      reasons.push({
        code: "accepting_new",
        message: "Currently accepting new patients",
        weight: 10,
      });
    }

    // Verified status boost
    if (dentist.verifiedStatus === "verified") {
      score += 5;
      reasons.push({
        code: "verified",
        message: "Verified practice",
        weight: 5,
      });
    }

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));

    scored.push({
      dentist: dentist as Dentist,
      score,
      reasons: reasons.sort((a, b) => b.weight - a.weight), // Sort by weight descending
    });
  }

  // Sort by score descending, take top 3
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((result) => ({
      ...result,
      reasons: result.reasons.map((r) => ({
        code: r.code,
        message: r.message,
        weight: r.weight,
      })),
    }));
}

