/**
 * Dentist Growth Analytics
 * Calculate metrics from events and leads
 */

import type { InferSelectModel } from "drizzle-orm";
import type { events, leads, dentists } from "@/db/schema";

export type Event = InferSelectModel<typeof events>;
export type Lead = InferSelectModel<typeof leads>;
export type Dentist = InferSelectModel<typeof dentists>;

export interface AnalyticsPeriod {
  views: number;
  leads: number;
  conversionRate: number; // leads / views
  avgLeadScore: number;
  callClicks: number;
  websiteClicks: number;
  matchImpressions: number;
}

export interface AnalyticsResult {
  last7Days: AnalyticsPeriod;
  last30Days: AnalyticsPeriod;
  leadPipeline: LeadPipelineMetrics;
}

export interface LeadPipelineMetrics {
  statusBreakdown: Record<Lead["status"], number>;
  avgResponseHours: number | null;
  contactedRate: number;
  bookedRate: number;
}

/**
 * Calculate analytics for a dentist
 */
export function calculateAnalytics(
  events: Event[],
  leads: Lead[],
  periodDays: number = 30
): AnalyticsPeriod {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);

  const periodEvents = events.filter((e) => e.createdAt >= cutoff);
  const periodLeads = leads.filter((l) => l.createdAt >= cutoff);

  const views = periodEvents.filter((e) => e.type === "profile_view").length;
  const leadSubmits = periodEvents.filter((e) => e.type === "lead_submit").length;
  const callClicks = periodEvents.filter((e) => e.type === "call_click").length;
  const websiteClicks = periodEvents.filter((e) => e.type === "website_click").length;
  const matchImpressions = periodEvents.filter((e) => e.type === "match_impression").length;

  const conversionRate = views > 0 ? (leadSubmits / views) * 100 : 0;

  const scoredLeads = periodLeads.filter((l) => l.leadScore !== null);
  const avgLeadScore =
    scoredLeads.length > 0
      ? scoredLeads.reduce((sum, l) => sum + (l.leadScore || 0), 0) / scoredLeads.length
      : 0;

  return {
    views,
    leads: leadSubmits,
    conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimals
    avgLeadScore: Math.round(avgLeadScore * 100) / 100,
    callClicks,
    websiteClicks,
    matchImpressions,
  };
}

function calculateLeadPipeline(leads: Lead[], periodDays: number = 30): LeadPipelineMetrics {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);

  const periodLeads = leads.filter((lead) => lead.createdAt >= cutoff);

  const statusBreakdown = periodLeads.reduce(
    (acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    },
    { new: 0, contacted: 0, booked: 0, lost: 0 } as Record<Lead["status"], number>
  );

  const contactedLeads = periodLeads.filter((lead) => lead.contactedAt);
  const responseHours =
    contactedLeads.reduce((acc, lead) => {
      const diffMs = (lead.contactedAt?.getTime() || 0) - lead.createdAt.getTime();
      return acc + diffMs / (1000 * 60 * 60);
    }, 0) / (contactedLeads.length || 1);

  const avgResponseHours =
    contactedLeads.length > 0 ? Math.round(responseHours * 10) / 10 : null;

  const totalLeads = periodLeads.length || 1;

  return {
    statusBreakdown,
    avgResponseHours,
    contactedRate: Math.round(((statusBreakdown.contacted + statusBreakdown.booked) / totalLeads) * 1000) / 10,
    bookedRate: Math.round((statusBreakdown.booked / totalLeads) * 1000) / 10,
  };
}

/**
 * Get analytics for both 7-day and 30-day periods
 */
export function getAnalytics(events: Event[], leads: Lead[]): AnalyticsResult {
  return {
    last7Days: calculateAnalytics(events, leads, 7),
    last30Days: calculateAnalytics(events, leads, 30),
    leadPipeline: calculateLeadPipeline(leads, 30),
  };
}
