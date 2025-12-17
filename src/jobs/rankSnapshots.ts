/**
 * Rank Snapshots Job
 * Computes weekly rank snapshots for all dentists
 */

import { db } from "@/db";
import { dentists, rankSnapshots } from "@/db/schema";
import { eq, and, gte, isNull } from "drizzle-orm";
import { sortDentists } from "@/lib/ranking";

/**
 * Compute rank snapshots for all cities and services
 */
export async function runRankSnapshotsJob(): Promise<{
  snapshotsCreated: number;
  cities: string[];
}> {
  const cities = ["palm-bay", "melbourne", "space-coast"];
  const services = ["emergency-dentist", "pediatric-dentist", "invisalign", "dental-implants", "teeth-cleaning"];
  let snapshotsCreated = 0;

  // Calculate week start for idempotency (same for all snapshots)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);

  for (const citySlug of cities) {
    // Get all dentists for city
    const cityDentists = await db
      .select()
      .from(dentists)
      .where(eq(dentists.citySlug, citySlug));

    // Sort by organic score (city hub)
    const sorted = sortDentists(cityDentists);

    // Create snapshots for city hub
    for (let i = 0; i < sorted.length; i++) {
      const dentist = sorted[i];
      const rank = i + 1;

      // Check if snapshot already exists for this week (idempotent)
      const existing = await db
        .select()
        .from(rankSnapshots)
        .where(
          and(
            eq(rankSnapshots.dentistId, dentist.id),
            eq(rankSnapshots.citySlug, citySlug),
            isNull(rankSnapshots.serviceSlug),
            gte(rankSnapshots.createdAt, weekStart)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(rankSnapshots).values({
          dentistId: dentist.id,
          citySlug,
          serviceSlug: null,
          rankPosition: rank,
          totalListings: sorted.length,
        });
        snapshotsCreated++;
      }
    }

    // Create snapshots for each service
    for (const serviceSlug of services) {
      const serviceDentists = cityDentists.filter((d) => {
        if (serviceSlug === "emergency-dentist" && d.servicesFlags?.emergency) return true;
        if (serviceSlug === "pediatric-dentist" && d.servicesFlags?.pediatric) return true;
        if (serviceSlug === "invisalign" && d.servicesFlags?.invisalign) return true;
        // For dental-implants and teeth-cleaning, include all (or filter based on servicesFlags if available)
        return true;
      });

      const sorted = sortDentists(serviceDentists, { service: serviceSlug });

      for (let i = 0; i < sorted.length; i++) {
        const dentist = sorted[i];
        const rank = i + 1;

        // Check if snapshot already exists for this week (idempotent)
        const existing = await db
          .select()
          .from(rankSnapshots)
          .where(
            and(
              eq(rankSnapshots.dentistId, dentist.id),
              eq(rankSnapshots.citySlug, citySlug),
              eq(rankSnapshots.serviceSlug, serviceSlug),
              gte(rankSnapshots.createdAt, weekStart)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          await db.insert(rankSnapshots).values({
            dentistId: dentist.id,
            citySlug,
            serviceSlug,
            rankPosition: rank,
            totalListings: sorted.length,
          });
          snapshotsCreated++;
        }
      }
    }
  }

  return {
    snapshotsCreated,
    cities,
  };
}
