import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dentists, subscriptions } from "@/db/schema";
import { updateAvailabilitySchema } from "@/lib/validators/availability";
import { getEntitlements } from "@/lib/entitlements";
import { rateLimit } from "@/lib/rate-limit";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "@/lib/auth";

/**
 * PUT /api/dentist/availability
 * Update availability flags (Pro/Premium only)
 */
export async function PUT(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request, {
    maxRequests: 10,
    windowMs: 60 * 1000,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    // Check authentication
    const session = await getServerSession(request);
    if (!session || session.role !== "dentist") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get dentist for this user
    const [dentist] = await db
      .select()
      .from(dentists)
      .where(eq(dentists.userId, session.userId))
      .limit(1);

    if (!dentist) {
      return NextResponse.json({ error: "Dentist not found" }, { status: 404 });
    }

    // Get subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.dentistId, dentist.id), eq(subscriptions.status, "active")))
      .limit(1);

    // Check entitlements
    const entitlements = getEntitlements(subscription, dentist);
    if (!entitlements.canEditAvailability) {
      return NextResponse.json({ error: "Feature requires Pro or Premium subscription" }, { status: 403 });
    }

    // Parse and validate input
    const body = await request.json();
    const validated = updateAvailabilitySchema.parse(body);

    // Update dentist
    const [updated] = await db
      .update(dentists)
      .set({
        acceptingNewPatients: validated.acceptingNewPatients ?? undefined,
        availabilityFlags: validated.availabilityFlags as any,
        availabilityLastUpdated: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(dentists.id, dentist.id))
      .returning();

    return NextResponse.json({ success: true, dentist: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Update availability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

