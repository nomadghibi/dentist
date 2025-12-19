import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dentists, reviews } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

const reviewSchema = z.object({
  dentistId: z.string().uuid(),
  rating: z.coerce.number().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().max(1000).optional(),
  wouldRecommend: z.boolean().optional(),
  source: z.string().max(50).optional(),
});

const querySchema = z.object({
  dentistId: z.string().uuid(),
  limit: z.coerce.number().min(1).max(50).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = reviewSchema.parse(body);

    const [dentist] = await db.select().from(dentists).where(eq(dentists.id, parsed.dentistId)).limit(1);
    if (!dentist) {
      return NextResponse.json({ error: "Dentist not found" }, { status: 404 });
    }

    const [review] = await db
      .insert(reviews)
      .values({
        dentistId: parsed.dentistId,
        rating: parsed.rating,
        title: parsed.title,
        comment: parsed.comment,
        wouldRecommend: parsed.wouldRecommend ?? null,
        source: parsed.source || "patient",
        status: "pending",
      })
      .returning();

    return NextResponse.json({ review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Error submitting review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  try {
    const { dentistId, limit = 20 } = parsed.data;
    const rows = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.dentistId, dentistId), eq(reviews.status, "approved")))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);

    return NextResponse.json({ reviews: rows });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
