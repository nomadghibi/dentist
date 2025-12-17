/**
 * Lead Follow-ups Job
 * Sends automated follow-up emails for unbooked leads
 */

import { db } from "@/db";
import { leads, leadFollowups, dentists } from "@/db/schema";
import { eq, and, lt, gte } from "drizzle-orm";

/**
 * Run follow-ups job
 * Sends 24h and 72h follow-up emails
 */
export async function runFollowupsJob(): Promise<{
  sent24h: number;
  sent72h: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let sent24h = 0;
  let sent72h = 0;

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

  // Find leads that need 24h follow-up
  // Created 24h ago (±1 hour window), status is "new"
  const leads24h = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.status, "new"),
        gte(leads.createdAt, new Date(twentyFourHoursAgo.getTime() - 60 * 60 * 1000)), // 23-25 hours ago
        lt(leads.createdAt, new Date(twentyFourHoursAgo.getTime() + 60 * 60 * 1000))
      )
    );

  // Find leads that need 72h follow-up
  // Created 72h ago (±1 hour window), status is "new"
  const leads72h = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.status, "new"),
        gte(leads.createdAt, new Date(seventyTwoHoursAgo.getTime() - 60 * 60 * 1000)), // 71-73 hours ago
        lt(leads.createdAt, new Date(seventyTwoHoursAgo.getTime() + 60 * 60 * 1000))
      )
    );

  // Check which ones already have follow-ups
  for (const lead of leads24h) {
    const existing = await db
      .select()
      .from(leadFollowups)
      .where(and(eq(leadFollowups.leadId, lead.id), eq(leadFollowups.step, "24h")))
      .limit(1);

    if (existing.length === 0) {
      try {
        await sendFollowupEmail(lead, "24h");
        await db.insert(leadFollowups).values({
          leadId: lead.id,
          step: "24h",
          sentAt: new Date(),
          channel: "email",
          status: "sent",
        });
        sent24h++;
      } catch (error: any) {
        errors.push(`24h follow-up for lead ${lead.id}: ${error.message}`);
      }
    }
  }

  for (const lead of leads72h) {
    const existing = await db
      .select()
      .from(leadFollowups)
      .where(and(eq(leadFollowups.leadId, lead.id), eq(leadFollowups.step, "72h")))
      .limit(1);

    if (existing.length === 0) {
      try {
        await sendFollowupEmail(lead, "72h");
        await db.insert(leadFollowups).values({
          leadId: lead.id,
          step: "72h",
          sentAt: new Date(),
          channel: "email",
          status: "sent",
        });
        sent72h++;
      } catch (error: any) {
        errors.push(`72h follow-up for lead ${lead.id}: ${error.message}`);
      }
    }
  }

  return { sent24h, sent72h, errors };
}

/**
 * Send follow-up email (placeholder - integrate with Resend)
 */
async function sendFollowupEmail(lead: typeof leads.$inferSelect, step: "24h" | "72h"): Promise<void> {
  // Get dentist info
  const [dentist] = await db
    .select()
    .from(dentists)
    .where(eq(dentists.id, lead.dentistId))
    .limit(1);

  if (!dentist) {
    throw new Error("Dentist not found");
  }

  // TODO: Integrate with Resend API
  // For now, just log
  console.log(`[FOLLOWUP] Sending ${step} email to ${lead.patientEmail} for ${dentist.name}`);

  // In production, use Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: "noreply@dentistfinder.com",
  //   to: lead.patientEmail,
  //   subject: step === "24h" ? "Still looking for a dentist?" : "We're here to help",
  //   html: generateFollowupEmail(lead, dentist, step),
  // });
}

