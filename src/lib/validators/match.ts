import { z } from "zod";

export const matchQuizAnswersSchema = z.object({
  city: z.enum(["palm-bay", "melbourne", "space-coast"]),
  urgency: z.enum(["emergency", "same-week", "flexible", "routine"]),
  insurance: z.string().optional(),
  adult_or_child: z.enum(["adult", "child", "both"]),
  anxiety_level: z.enum(["none", "low", "moderate", "high"]),
  weekend_need: z.boolean(),
  language: z.string().optional(),
  budget_sensitivity: z.enum(["not-important", "somewhat", "very-important"]).optional(),
});

export type MatchQuizAnswers = z.infer<typeof matchQuizAnswersSchema>;

