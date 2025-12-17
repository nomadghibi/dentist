import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dentists, subscriptions, events, leads } from "@/db/schema";
import { getEntitlements } from "@/lib/entitlements";
import { getAnalytics } from "@/lib/analytics";
import { eq, and, gte } from "drizzle-orm";
import { getServerSession } from "@/lib/auth";

/**
 * GET /api/dentist/analytics
 * Get analytics dashboard data (Pro/Premium only)
 */
export async function GET(request: NextRequest) {
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
    if (!entitlements.canViewBasicAnalytics) {
      return NextResponse.json({ error: "Feature requires Pro or Premium subscription" }, { status: 403 });
    }

    // Get events (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dentistEvents = await db
      .select()
      .from(events)
      .where(and(eq(events.dentistId, dentist.id), gte(events.createdAt, thirtyDaysAgo)));

    // Get leads (last 30 days)
    const dentistLeads = await db
      .select()
      .from(leads)
      .where(and(eq(leads.dentistId, dentist.id), gte(leads.createdAt, thirtyDaysAgo)));

    // Calculate analytics
    const analytics = getAnalytics(dentistEvents, dentistLeads);

    // Get recent leads with scores
    const recentLeads = dentistLeads
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((lead) => ({
        id: lead.id,
        patientName: lead.patientName,
        patientEmail: lead.patientEmail,
        leadScore: lead.leadScore,
        status: lead.status,
        createdAt: lead.createdAt,
      }));

    return NextResponse.json({
      analytics,
      recentLeads,
      entitlements: {
        canViewAdvancedAnalytics: entitlements.canViewAdvancedAnalytics,
        canExportCSV: entitlements.canExportCSV,
      },
    });
  } catch (error: any) {
    console.error("Get analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

