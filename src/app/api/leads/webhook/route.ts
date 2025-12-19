import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dentists, leads, subscriptions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth";
import { z } from "zod";
import { getEntitlements } from "@/lib/entitlements";

const webhookSchema = z.object({
  url: z.string().url(),
  leadId: z.string().uuid(),
});

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Failed to deliver webhook";

export async function POST(request: NextRequest) {
  const session = await getServerSession(request);
  if (!session || session.role !== "dentist") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = webhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const [dentist] = await db
      .select()
      .from(dentists)
      .where(eq(dentists.userId, session.userId))
      .limit(1);

    if (!dentist) {
      return NextResponse.json({ error: "Dentist not found" }, { status: 404 });
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.dentistId, dentist.id))
      .limit(1);

    const entitlements = getEntitlements(subscription || null, dentist);
    if (!entitlements.canViewBasicAnalytics) {
      return NextResponse.json(
        { error: "Webhook delivery requires an active subscription" },
        { status: 403 }
      );
    }

    const [lead] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, parsed.data.leadId), eq(leads.dentistId, dentist.id)))
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const payload = {
      event: "lead.created",
      sentAt: new Date().toISOString(),
      lead: {
        id: lead.id,
        patientName: lead.patientName,
        patientEmail: lead.patientEmail,
        patientPhone: lead.patientPhone,
        message: lead.message,
        status: lead.status,
        leadScore: lead.leadScore,
        createdAt: lead.createdAt,
        contactedAt: lead.contactedAt,
        bookedAt: lead.bookedAt,
      },
      dentist: {
        id: dentist.id,
        name: dentist.name,
        city: dentist.cityName,
        state: dentist.state,
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(parsed.data.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Zapier-Event": "lead.created",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return NextResponse.json(
          { error: "Webhook endpoint returned an error", statusText: response.statusText },
          { status: 502 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      clearTimeout(timeout);
      const isAbort = error instanceof Error && error.name === "AbortError";
      const message = isAbort ? "Webhook request timed out" : toErrorMessage(error);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (error) {
    console.error("Error delivering webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
