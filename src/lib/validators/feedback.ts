import { z } from "zod";

// Phase 2: Private Feedback
export const feedbackSchema = z.object({
  dentistId: z.string().uuid(),
  leadId: z.string().uuid().optional(),
  ratingOverall: z.number().int().min(1).max(5),
  waitTimeRating: z.number().int().min(1).max(5).optional(),
  bedsideMannerRating: z.number().int().min(1).max(5).optional(),
  wouldRecommend: z.boolean(),
  comment: z.string().max(500).optional(),
});

export type Feedback = z.infer<typeof feedbackSchema>;

// PHI keywords to reject (simple list)
export const PHI_KEYWORDS = [
  "diagnosis",
  "diagnosed",
  "treatment plan",
  "prescription",
  "medication",
  "x-ray",
  "xray",
  "radiograph",
  "medical history",
  "condition",
  "disease",
  "infection",
  "cavity",
  "root canal",
  "extraction",
];

export function containsPHI(text: string): boolean {
  const lower = text.toLowerCase();
  return PHI_KEYWORDS.some((keyword) => lower.includes(keyword));
}

