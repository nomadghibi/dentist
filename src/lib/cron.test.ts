import { describe, it, expect, vi } from "vitest";
import { verifyCronRequest, isVercelCron } from "./cron";
import { NextRequest } from "next/server";

// Mock environment
const originalEnv = process.env;

describe("Cron Verification", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, CRON_SECRET: "test-secret-123" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("verifies Vercel cron header", () => {
    const headers = new Headers();
    headers.set("x-vercel-cron", "1");

    const request = new NextRequest("http://localhost/api/cron/test", {
      headers,
    });

    const result = verifyCronRequest(request);
    expect(result.valid).toBe(true);
  });

  it("verifies Authorization Bearer token", () => {
    const headers = new Headers();
    headers.set("authorization", "Bearer test-secret-123");

    const request = new NextRequest("http://localhost/api/cron/test", {
      headers,
    });

    const result = verifyCronRequest(request);
    expect(result.valid).toBe(true);
  });

  it("rejects invalid Bearer token", () => {
    const headers = new Headers();
    headers.set("authorization", "Bearer wrong-secret");

    const request = new NextRequest("http://localhost/api/cron/test", {
      headers,
    });

    const result = verifyCronRequest(request);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Invalid cron secret");
  });

  it("rejects requests without verification", () => {
    const request = new NextRequest("http://localhost/api/cron/test");

    const result = verifyCronRequest(request);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Missing cron verification");
  });

  it("checks Vercel cron header correctly", () => {
    const headers = new Headers();
    headers.set("x-vercel-cron", "1");

    const request = new NextRequest("http://localhost/api/cron/test", {
      headers,
    });

    expect(isVercelCron(request)).toBe(true);
  });

  it("returns false for non-Vercel cron requests", () => {
    const request = new NextRequest("http://localhost/api/cron/test");

    expect(isVercelCron(request)).toBe(false);
  });
});

