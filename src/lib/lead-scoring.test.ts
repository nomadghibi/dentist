import { describe, it, expect } from "vitest";
import { computeLeadScore } from "./lead-scoring";

describe("Lead Scoring", () => {
  it("scores emergency leads higher", () => {
    const result = computeLeadScore({ urgency: "emergency" });
    expect(result.score).toBeGreaterThan(50);
    expect(result.reasons).toContain("Emergency request");
  });

  it("scores leads with insurance higher", () => {
    const result = computeLeadScore({ insurance: "Blue Cross" });
    expect(result.score).toBeGreaterThan(50);
    expect(result.reasons).toContain("Insurance information provided");
  });

  it("scores leads with phone higher", () => {
    const result = computeLeadScore({ hasPhone: true });
    expect(result.score).toBeGreaterThan(50);
    expect(result.reasons).toContain("Phone number provided");
  });

  it("scores detailed messages higher", () => {
    const shortMessage = computeLeadScore({ messageLength: 20 });
    const longMessage = computeLeadScore({ messageLength: 150 });
    expect(longMessage.score).toBeGreaterThan(shortMessage.score);
  });

  it("scores quiz leads higher", () => {
    const quizLead = computeLeadScore({ sourceUrl: "/match" });
    const regularLead = computeLeadScore({ sourceUrl: "/" });
    expect(quizLead.score).toBeGreaterThan(regularLead.score);
  });

  it("clamps score to 0-100", () => {
    const result = computeLeadScore({
      urgency: "emergency",
      insurance: "test",
      hasPhone: true,
      messageLength: 200,
      cityMatch: true,
      sourceUrl: "/match",
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns explainable reasons", () => {
    const result = computeLeadScore({
      urgency: "same-week",
      hasPhone: true,
    });
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.reasons).toContain("Same-week appointment");
    expect(result.reasons).toContain("Phone number provided");
  });
});

