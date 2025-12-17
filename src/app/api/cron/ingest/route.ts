import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest, isVercelCron } from "@/lib/cron";
import { z } from "zod";

const querySchema = z.object({
  city: z.enum(["palm-bay", "melbourne", "space-coast"]),
});

/**
 * POST /api/cron/ingest?city=...
 * Vercel Cron endpoint - verifies cron header, then calls internal job endpoint
 */
export async function POST(request: NextRequest) {
  // Verify this is from Vercel Cron
  const verification = verifyCronRequest(request);
  if (!verification.valid) {
    return NextResponse.json({ error: "Unauthorized", reason: verification.reason }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    if (!city) {
      return NextResponse.json({ error: "Missing city parameter" }, { status: 400 });
    }

    const validated = querySchema.parse({ city });

    // Call internal job endpoint with Authorization header
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const jobUrl = `${baseUrl}/api/jobs/ingest?city=${validated.city}`;

    const response = await fetch(jobUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || "Job failed",
          fromJob: true,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job triggered successfully",
      jobResult: data,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }

    console.error("Cron ingest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

