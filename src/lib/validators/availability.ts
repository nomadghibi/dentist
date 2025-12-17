import { z } from "zod";

export const availabilityFlagsSchema = z.object({
  same_week: z.boolean().optional(),
  emergency_today: z.boolean().optional(),
  weekend: z.boolean().optional(),
});

export const updateAvailabilitySchema = z.object({
  acceptingNewPatients: z.boolean().nullable(),
  availabilityFlags: availabilityFlagsSchema.optional(),
});

export type AvailabilityFlags = z.infer<typeof availabilityFlagsSchema>;
export type UpdateAvailability = z.infer<typeof updateAvailabilitySchema>;

