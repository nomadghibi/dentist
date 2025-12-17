import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron";
import { runJob } from "@/lib/jobs";
import { runIngestJob } from "@/jobs/ingest";
import { z } from "zod";

const querySchema = z.object({
  city: z.enum(["palm-bay", "melbourne", "space-coast"]),
});

/**
 * POST /api/jobs/ingest?city=...
 * Protected job endpoint - requires CRON_SECRET
 */
export async function POST(request: NextRequest) {
  // Verify cron request (Authorization Bearer token)
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

    // Run job with standardized wrapper
    const result = await runJob(
      {
        jobName: "ingest",
        meta: { city: validated.city },
      },
      () => runIngestJob(validated.city),
      {
        timeoutMs: 10 * 60 * 1000, // 10 minutes for ingestion
      }
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          duration: result.duration,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      duration: result.duration,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }

    console.error("Ingest job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
