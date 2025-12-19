import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, events, dentists } from "@/db/schema";
import { z } from "zod";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { computeLeadScore } from "@/lib/lead-scoring";
import { and, desc, eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth";
import crypto from "crypto";

const leadsQuerySchema = z.object({
  status: z.enum(["new", "contacted", "booked", "lost"]).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

const updateLeadSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "booked", "lost"]).optional(),
  note: z
    .object({
      body: z.string().min(1).max(1000),
      author: z.string().min(1).max(200),
    })
    .optional(),
});

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
        leadScoreReasons: scoringResult.reasons,
        status: "new",
      })
      .returning();

    // Track lead_submit event
    db.insert(events)
      .values({
        dentistId: validated.dentistId,
        type: "lead_submit",
        meta: { leadId: lead.id, leadScore: scoringResult.score },
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

/**
 * GET /api/leads
 * Fetch leads for the authenticated dentist
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || session.role !== "dentist") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validated = leadsQuerySchema.safeParse(searchParams);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { status, limit = 50 } = validated.data;

    const [dentist] = await db
      .select({ id: dentists.id })
      .from(dentists)
      .where(eq(dentists.userId, session.userId))
      .limit(1);

    if (!dentist) {
      return NextResponse.json({ error: "Dentist not found" }, { status: 404 });
    }

    const condition = status
      ? and(eq(leads.dentistId, dentist.id), eq(leads.status, status))
      : eq(leads.dentistId, dentist.id);

    const rows = await db.select().from(leads).where(condition).orderBy(desc(leads.createdAt)).limit(limit);

    return NextResponse.json({ leads: rows });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/leads
 * Update lead status or append a note
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || session.role !== "dentist") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const [dentist] = await db
      .select({ id: dentists.id })
      .from(dentists)
      .where(eq(dentists.userId, session.userId))
      .limit(1);

    if (!dentist) {
      return NextResponse.json({ error: "Dentist not found" }, { status: 404 });
    }

    const [existing] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, parsed.data.id), eq(leads.dentistId, dentist.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const notes = existing.notes ? [...existing.notes] : [];
    if (parsed.data.note) {
      notes.push({
        id: crypto.randomUUID(),
        body: parsed.data.note.body,
        author: parsed.data.note.author,
        createdAt: new Date().toISOString(),
      });
    }

    const [updated] = await db
      .update(leads)
      .set({
        status: parsed.data.status ?? existing.status,
        notes,
        contactedAt:
          parsed.data.status === "contacted" && !existing.contactedAt
            ? new Date()
            : existing.contactedAt,
        bookedAt:
          parsed.data.status === "booked" && !existing.bookedAt ? new Date() : existing.bookedAt,
      })
      .where(eq(leads.id, existing.id))
      .returning();

    return NextResponse.json({ lead: updated });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
