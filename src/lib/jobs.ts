/**
 * Job Runner Utilities
 * Standardized wrapper for all scheduled jobs with logging, error handling, and timeouts
 */

import { db } from "@/db";
import { jobRuns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface JobResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
}

export interface JobContext {
  jobName: string;
  meta?: Record<string, unknown>;
}

/**
 * Run a job with standardized logging, error handling, and timeout
 */
export async function runJob<T = unknown>(
  context: JobContext,
  jobFn: () => Promise<T>,
  options: {
    timeoutMs?: number;
    retries?: number;
  } = {}
): Promise<JobResult<T>> {
  const { jobName, meta = {} } = context;
  const { timeoutMs = 5 * 60 * 1000, retries = 0 } = options; // Default 5 min timeout

  const startTime = Date.now();
  let jobRunId: string | undefined;

  try {
    // Create job run record
    const [jobRun] = await db
      .insert(jobRuns)
      .values({
        name: jobName,
        status: "running",
        meta: meta as any,
      })
      .returning();

    jobRunId = jobRun.id;

    console.log(`[JOB] ${jobName} started`, { meta, jobRunId });

    // Run job with timeout
    const result = await Promise.race([
      jobFn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Job timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);

    const duration = Date.now() - startTime;

    // Update job run as completed
    await db
      .update(jobRuns)
      .set({
        status: "completed",
        finishedAt: new Date(),
        meta: { ...meta, duration, result: result as any } as any,
      })
      .where(eq(jobRuns.id, jobRunId));

    console.log(`[JOB] ${jobName} completed in ${duration}ms`, { jobRunId });

    return {
      success: true,
      data: result,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMessage = error?.message || String(error);

    console.error(`[JOB] ${jobName} failed after ${duration}ms:`, errorMessage);

    // Update job run as failed
    if (jobRunId) {
      await db
        .update(jobRuns)
        .set({
          status: "failed",
          finishedAt: new Date(),
          error: errorMessage,
          meta: { ...meta, duration } as any,
        })
        .where(eq(jobRuns.id, jobRunId));
    } else {
      // Create failed record if we didn't get to create one
      await db.insert(jobRuns).values({
        name: jobName,
        status: "failed",
        finishedAt: new Date(),
        error: errorMessage,
        meta: { ...meta, duration } as any,
      });
    }

    return {
      success: false,
      error: errorMessage,
      duration,
    };
  }
}

/**
 * Get recent job runs for monitoring
 */
export async function getRecentJobRuns(jobName: string, limit: number = 10) {
  return db
    .select()
    .from(jobRuns)
    .where(eq(jobRuns.name, jobName))
    .orderBy(desc(jobRuns.startedAt))
    .limit(limit);
}

