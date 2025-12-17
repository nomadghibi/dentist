import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const eventSchema = z.object({
  dentistId: z.string().uuid().optional(),
  type: z.enum(["profile_view", "lead_submit", "call_click", "website_click", "match_impression"]),
  meta: z.record(z.unknown()).optional(),
});

/**
 * POST /api/events
 * Track events (views, clicks, etc.)
 */
export async function POST(request: NextRequest) {
  // Rate limiting (more lenient for events)
  const rateLimitResult = await rateLimit(request, {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  });

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const eventData = eventSchema.parse(body);

    // Insert event (async, don't wait)
    db.insert(events)
      .values({
        dentistId: eventData.dentistId || null,
        type: eventData.type,
        meta: (eventData.meta || {}) as any,
      })
      .catch((err) => {
        console.error("Event tracking error:", err);
        // Don't fail the request if event tracking fails
      });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Event tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

