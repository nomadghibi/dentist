import { redirect } from "next/navigation";
import { db } from "@/db";
import { dentists, subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import AvailabilityForm from "@/components/AvailabilityForm";
import PricingForm from "@/components/PricingForm";
import LeadList from "@/components/LeadList";
import { getEntitlements } from "@/lib/entitlements";
import { getServerSession } from "@/lib/auth";

export default async function DentistDashboardPage() {
  // Get user from session
  const session = await getServerSession();

  if (!session || session.role !== "dentist") {
    redirect("/dentist/login");
  }

  const userId = session.userId;

  // Find dentist linked to this user
  const [dentist] = await db
    .select()
    .from(dentists)
    .where(eq(dentists.userId, userId))
    .limit(1);

  if (!dentist) {
    redirect("/claim");
  }

  const dentistId = dentist.id;

  // Get subscription
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.dentistId, dentistId), eq(subscriptions.status, "active")))
    .limit(1);

  // Get entitlements
  const entitlements = getEntitlements(subscription, dentist);

  // Fetch analytics (if entitled)
  let analytics = null;
  let recentLeads: any[] = [];

  if (entitlements.canViewBasicAnalytics) {
    try {
      // In a real implementation, this would call the API route
      // For now, we'll fetch directly
      const { events, leads } = await import("@/db/schema");
      const { getAnalytics } = await import("@/lib/analytics");
      const { gte } = await import("drizzle-orm");

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dentistEvents = await db
        .select()
        .from(events)
        .where(and(eq(events.dentistId, dentistId), gte(events.createdAt, thirtyDaysAgo)));

      const dentistLeads = await db
        .select()
        .from(leads)
        .where(and(eq(leads.dentistId, dentistId), gte(leads.createdAt, thirtyDaysAgo)));

      analytics = getAnalytics(dentistEvents, dentistLeads);

      recentLeads = dentistLeads
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map((lead) => ({
          id: lead.id,
          patientName: lead.patientName,
          patientEmail: lead.patientEmail,
          leadScore: lead.leadScore,
          status: lead.status,
          createdAt: lead.createdAt.toISOString(),
        }));
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">
            Welcome back, {dentist.name}
          </p>
        </div>

        {/* Subscription Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Subscription</h2>
              {subscription && subscription.status === "active" ? (
                <div>
                  <p className="text-slate-600">
                    <span className="font-medium">Plan:</span> {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                  </p>
                  <p className="text-sm text-slate-500">
                    Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-slate-600 mb-4">No active subscription</p>
              )}
            </div>
            <div className="flex gap-4">
              {(!subscription || subscription.status !== "active") && (
                <Link
                  href="/for-dentists#pricing"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  View Plans
                </Link>
              )}
              <form action="/api/dentist/logout" method="POST">
                <button
                  type="submit"
                  className="px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Analytics Panel */}
        {analytics && entitlements.canViewBasicAnalytics && (
          <div className="mb-8">
            <AnalyticsPanel
              data={analytics}
              canViewAdvanced={entitlements.canViewAdvancedAnalytics}
            />
          </div>
        )}

        {/* Lead List */}
        {entitlements.canViewLeadScoring && (
          <div className="mb-8">
            <LeadList leads={recentLeads} canViewScores={true} />
          </div>
        )}

        {/* Availability & Pricing Forms */}
        {entitlements.canEditAvailability && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <AvailabilityForm
              initialData={{
                acceptingNewPatients: dentist.acceptingNewPatients,
                availabilityFlags: dentist.availabilityFlags as any,
              }}
            />
            <PricingForm initialData={dentist.pricingRanges as any} />
          </div>
        )}

        {/* Profile Link */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Public Profile</h2>
          <p className="text-slate-600 mb-4">
            <strong>Location:</strong> {dentist.cityName}, {dentist.state}
          </p>
          <Link
            href={`/fl/${dentist.citySlug}/dentists/${dentist.slug}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Public Profile →
          </Link>
        </div>
      </div>
    </div>
  );
}
