import type { NextRequest } from "next/server";

// Simple in-memory rate limiter for dev/staging
// For production, use Redis or similar

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = store[identifier];

  if (!record || now > record.resetAt) {
    // New window or expired
    store[identifier] = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: now + options.windowMs,
    };
  }

  if (record.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: options.maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

export function getRateLimitIdentifier(request: Request): string {
  // Use IP address or other identifier
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}

// Async rate limit function for Next.js API routes
export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<{ success: boolean; remaining?: number; resetAt?: number }> {
  const identifier = getRateLimitIdentifier(request);
  const result = checkRateLimit(identifier, options);
  return {
    success: result.allowed,
    remaining: result.remaining,
    resetAt: result.resetAt,
  };
}

