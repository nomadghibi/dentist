/**
 * Lead Quality Scoring
 * Deterministic rules-based scoring (0-100)
 */

export interface LeadScoringInput {
  urgency?: string;
  insurance?: string;
  timePreference?: string;
  messageLength?: number;
  cityMatch?: boolean;
  hasPhone?: boolean;
  sourceUrl?: string;
}

export interface LeadScoringResult {
  score: number; // 0-100
  reasons: string[];
}

/**
 * Compute lead quality score
 */
export function computeLeadScore(input: LeadScoringInput): LeadScoringResult {
  let score = 50; // Base score
  const reasons: string[] = [];

  // Urgency (0-20 points)
  if (input.urgency === "emergency") {
    score += 20;
    reasons.push("Emergency request");
  } else if (input.urgency === "same-week") {
    score += 15;
    reasons.push("Same-week appointment");
  } else if (input.urgency === "flexible") {
    score += 10;
    reasons.push("Flexible timing");
  } else {
    score += 5;
    reasons.push("Routine appointment");
  }

  // Insurance match (0-15 points)
  if (input.insurance) {
    score += 15;
    reasons.push("Insurance information provided");
  }

  // Message quality (0-15 points)
  const messageLength = input.messageLength || 0;
  if (messageLength > 100) {
    score += 15;
    reasons.push("Detailed message");
  } else if (messageLength > 50) {
    score += 10;
    reasons.push("Moderate message detail");
  } else if (messageLength > 0) {
    score += 5;
    reasons.push("Brief message");
  }

  // Contact information (0-10 points)
  if (input.hasPhone) {
    score += 10;
    reasons.push("Phone number provided");
  }

  // City match (0-10 points)
  if (input.cityMatch) {
    score += 10;
    reasons.push("City match confirmed");
  }

  // Source quality (0-10 points)
  if (input.sourceUrl?.includes("/match")) {
    score += 10;
    reasons.push("From matching quiz");
  } else if (input.sourceUrl?.includes("/fl/")) {
    score += 5;
    reasons.push("From city/service page");
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  return { score, reasons };
}

