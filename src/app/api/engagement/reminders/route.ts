import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { leadFollowups, leads } from "@/db/schema";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const reminderSchema = z.object({
  leadId: z.string().uuid(),
  reminderWindow: z.enum(["24h", "72h", "week-before", "same-day"]).optional(),
  channel: z.enum(["email", "sms"]).default("email"),
  preferredTime: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const identifier = getRateLimitIdentifier(request);
  const rateLimit = checkRateLimit(identifier, {
    windowMs: 10 * 60 * 1000,
    maxRequests: 12,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many reminders requested. Please try again soon." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const validated = reminderSchema.parse(body);

    const [lead] = await db.select().from(leads).where(eq(leads.id, validated.leadId)).limit(1);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const notes = lead.notes ? [...lead.notes] : [];
    const parts = [
      "Patient opted into a reminder",
      validated.reminderWindow ? `window: ${validated.reminderWindow}` : undefined,
      `channel: ${validated.channel}`,
      validated.preferredTime ? `time: ${validated.preferredTime}` : undefined,
      validated.note ? `note: ${validated.note}` : undefined,
    ].filter(Boolean);

    notes.push({
      id: crypto.randomUUID(),
      body: parts.join(" | "),
      author: "system",
      createdAt: new Date().toISOString(),
    });

    await db.transaction(async (tx) => {
      await tx.insert(leadFollowups).values({
        leadId: lead.id,
        step: validated.reminderWindow ? `reminder-${validated.reminderWindow}` : "reminder-custom",
        sentAt: new Date(),
        channel: validated.channel,
        status: "scheduled",
      });

      await tx.update(leads).set({ notes }).where(eq(leads.id, lead.id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }

    console.error("Error scheduling reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
