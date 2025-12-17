/**
 * Entitlements & Feature Access
 * Server-side checks for subscription features
 */

import type { InferSelectModel } from "drizzle-orm";
import type { subscriptions, dentists } from "@/db/schema";

export type Subscription = InferSelectModel<typeof subscriptions>;
export type Dentist = InferSelectModel<typeof dentists>;

export interface Entitlements {
  canEditAvailability: boolean;
  canEditPricing: boolean;
  canViewLeadScoring: boolean;
  canViewBasicAnalytics: boolean;
  canViewAdvancedAnalytics: boolean;
  canExportCSV: boolean;
  canViewCompetitorInsights: boolean;
  canViewFeedbackInsights: boolean;
}

/**
 * Get entitlements for a dentist based on subscription
 */
export function getEntitlements(
  subscription: Subscription | null,
  dentist: Dentist | null
): Entitlements {
  const plan = subscription?.plan || "free";
  const isActive = subscription?.status === "active";
  const isClaimed = dentist?.userId !== null;

  // Free tier: view only, no edits
  const base = {
    canEditAvailability: false,
    canEditPricing: false,
    canViewLeadScoring: false,
    canViewBasicAnalytics: false,
    canViewAdvancedAnalytics: false,
    canExportCSV: false,
    canViewCompetitorInsights: false,
    canViewFeedbackInsights: false,
  };

  if (!isClaimed) {
    return base;
  }

  if (!isActive) {
    return base;
  }

  // Pro tier
  if (plan === "pro") {
    return {
      ...base,
      canEditAvailability: true,
      canEditPricing: true,
      canViewLeadScoring: true,
      canViewBasicAnalytics: true,
    };
  }

  // Premium tier
  if (plan === "premium") {
    return {
      canEditAvailability: true,
      canEditPricing: true,
      canViewLeadScoring: true,
      canViewBasicAnalytics: true,
      canViewAdvancedAnalytics: true,
      canExportCSV: true,
      canViewCompetitorInsights: true,
      canViewFeedbackInsights: true,
    };
  }

  return base;
}

