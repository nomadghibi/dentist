import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, events, dentists } from "@/db/schema";
import { z } from "zod";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { computeLeadScore } from "@/lib/lead-scoring";
import { eq } from "drizzle-orm";

const leadSchema = z.object({
  dentistId: z.string().uuid(),
  patientName: z.string().min(1).max(200),
  patientEmail: z.string().email(),
  patientPhone: z.string().optional(),
  message: z.string().max(1000).optional(),
  sourceUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  // Rate limiting
  const identifier = getRateLimitIdentifier(request);
  const rateLimit = checkRateLimit(identifier, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const validated = leadSchema.parse(body);

    // Get dentist for city match check
    const [dentist] = await db
      .select({ citySlug: dentists.citySlug, insurances: dentists.insurances })
      .from(dentists)
      .where(eq(dentists.id, validated.dentistId))
      .limit(1);

    // Compute lead score
    const scoringInput = {
      messageLength: validated.message?.length || 0,
      hasPhone: !!validated.patientPhone,
      sourceUrl: validated.sourceUrl || undefined,
      // Extract urgency from message if present
      urgency: validated.message?.toLowerCase().includes("emergency")
        ? "emergency"
        : validated.message?.toLowerCase().includes("urgent")
        ? "same-week"
        : undefined,
    };

    const scoringResult = computeLeadScore(scoringInput);

    // Insert lead with score
    const [lead] = await db
      .insert(leads)
      .values({
        dentistId: validated.dentistId,
        patientName: validated.patientName,
        patientEmail: validated.patientEmail,
        patientPhone: validated.patientPhone || null,
        message: validated.message || null,
        sourceUrl: validated.sourceUrl || null,
        leadScore: scoringResult.score,
        leadScoreReasons: scoringResult.reasons as any,
        status: "new",
      })
      .returning();

    // Track lead_submit event
    db.insert(events)
      .values({
        dentistId: validated.dentistId,
        type: "lead_submit",
        meta: { leadId: lead.id, leadScore: scoringResult.score } as any,
      })
      .catch((err) => {
        console.error("Event tracking error:", err);
      });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }

    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

