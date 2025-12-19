import { db } from "@/db";
import { dentists, reviews } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function recalcDentistRating(dentistId: string) {
  const [aggregate] = await db
    .select({
      count: sql<number>`count(*)`,
      average: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
    })
    .from(reviews)
    .where(and(eq(reviews.dentistId, dentistId), eq(reviews.status, "approved")));

  const reviewCount = Number(aggregate?.count ?? 0);
  const averageRating = reviewCount > 0 ? Number(aggregate?.average ?? 0) : 0;

  await db
    .update(dentists)
    .set({
      reviewCount,
      averageRating,
      updatedAt: new Date(),
    })
    .where(eq(dentists.id, dentistId));
}
