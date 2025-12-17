import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron";
import { runJob } from "@/lib/jobs";
import { runFollowupsJob } from "@/jobs/followups";

/**
 * POST /api/jobs/followups
 * Protected job endpoint - requires CRON_SECRET
 */
export async function POST(request: NextRequest) {
  // Verify cron request (Authorization Bearer token)
  const verification = verifyCronRequest(request);
  if (!verification.valid) {
    return NextResponse.json({ error: "Unauthorized", reason: verification.reason }, { status: 401 });
  }

  try {
    // Run job with standardized wrapper
    const result = await runJob(
      {
        jobName: "followups",
      },
      () => runFollowupsJob(),
      {
        timeoutMs: 5 * 60 * 1000, // 5 minutes for follow-ups
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
    console.error("Followups job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

