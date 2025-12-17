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

/**
 * Get analytics for both 7-day and 30-day periods
 */
export function getAnalytics(events: Event[], leads: Lead[]): AnalyticsResult {
  return {
    last7Days: calculateAnalytics(events, leads, 7),
    last30Days: calculateAnalytics(events, leads, 30),
  };
}

