/**
 * Cron Verification Utilities
 * Secure verification for Vercel Cron requests
 */

import { NextRequest } from "next/server";

function getCronSecret() {
  return process.env.CRON_SECRET || "";
}

/**
 * Verify that a request is from Vercel Cron
 * Checks for x-vercel-cron header OR Authorization Bearer token
 */
export function verifyCronRequest(request: NextRequest): {
  valid: boolean;
  reason?: string;
} {
  // Method 1: Check for Vercel cron header
  const vercelCronHeader = request.headers.get("x-vercel-cron");
  if (vercelCronHeader === "1" || vercelCronHeader === "true") {
    return { valid: true };
  }

  // Method 2: Check for Authorization Bearer token (for internal calls)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const cronSecret = getCronSecret();
    if (token === cronSecret && cronSecret) {
      return { valid: true };
    }
    return { valid: false, reason: "Invalid cron secret" };
  }

  // Method 3: Check for cron secret in query param (less secure, but fallback)
  const querySecret = request.nextUrl.searchParams.get("secret");
  const cronSecret = getCronSecret();
  if (querySecret === cronSecret && cronSecret) {
    return { valid: true };
  }

  return { valid: false, reason: "Missing cron verification" };
}

/**
 * Check if request is from Vercel Cron (header-based)
 */
export function isVercelCron(request: NextRequest): boolean {
  const header = request.headers.get("x-vercel-cron");
  return header === "1" || header === "true";
}
