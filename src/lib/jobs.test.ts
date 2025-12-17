import { describe, it, expect, vi, beforeEach } from "vitest";
import { runJob } from "./jobs";

describe("Job Runner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs job successfully and logs result", async () => {
    const mockJob = vi.fn().mockResolvedValue({ data: "test" });

    const result = await runJob(
      { jobName: "test-job", meta: { test: true } },
      mockJob
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ data: "test" });
    expect(result.duration).toBeGreaterThan(0);
    expect(mockJob).toHaveBeenCalledOnce();
  });

  it("handles job errors gracefully", async () => {
    const mockJob = vi.fn().mockRejectedValue(new Error("Job failed"));

    const result = await runJob(
      { jobName: "test-job" },
      mockJob
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Job failed");
    expect(result.duration).toBeGreaterThan(0);
  });

  it("respects timeout", async () => {
    const mockJob = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve("done"), 1000))
    );

    const result = await runJob(
      { jobName: "test-job" },
      mockJob,
      { timeoutMs: 100 } // 100ms timeout
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("timeout");
  });

  it("includes metadata in job run", async () => {
    const mockJob = vi.fn().mockResolvedValue({});

    await runJob(
      { jobName: "test-job", meta: { city: "palm-bay", count: 5 } },
      mockJob
    );

    expect(mockJob).toHaveBeenCalled();
    // Job run should be created with metadata
  });
});

