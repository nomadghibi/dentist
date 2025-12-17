import { z } from "zod";

const priceRangeSchema = z.object({
  min: z.number().positive(),
  max: z.number().positive(),
}).refine((data) => data.max >= data.min, {
  message: "Max must be greater than or equal to min",
});

export const pricingRangesSchema = z.object({
  cleaning: priceRangeSchema.optional(),
  emergency_visit: priceRangeSchema.optional(),
  crown: priceRangeSchema.optional(),
  invisalign: priceRangeSchema.optional(),
  implants: priceRangeSchema.optional(),
});

export const updatePricingSchema = z.object({
  pricingRanges: pricingRangesSchema.optional(),
});

export type PricingRanges = z.infer<typeof pricingRangesSchema>;
export type UpdatePricing = z.infer<typeof updatePricingSchema>;

