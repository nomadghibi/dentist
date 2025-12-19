import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminAudit, dentists, reviews } from "@/db/schema";
import { getAdminUser } from "@/app/api/admin/helpers";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { recalcDentistRating } from "@/lib/reviews";

const moderationSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

const querySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  const adminUser = await getAdminUser(request);
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const { status = "pending", limit = 25 } = parsed.data;

  const rows = await db
    .select({
      review: reviews,
      dentistName: dentists.name,
      cityName: dentists.cityName,
    })
    .from(reviews)
    .innerJoin(dentists, eq(reviews.dentistId, dentists.id))
    .where(eq(reviews.status, status))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);

  return NextResponse.json({ reviews: rows });
}

export async function PATCH(request: NextRequest) {
  const adminUser = await getAdminUser(request);
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = moderationSchema.parse(body);

    const [existing] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.id, parsed.id), eq(reviews.status, "pending")))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await db
      .update(reviews)
      .set({
        status: parsed.status,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, parsed.id));

    await recalcDentistRating(existing.dentistId);

    await db.insert(adminAudit).values({
      adminUserId: adminUser.id,
      action: parsed.status === "approved" ? "review_approve" : "review_reject",
      entityType: "review",
      entityId: existing.id,
      meta: { dentistId: existing.dentistId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Error moderating review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
