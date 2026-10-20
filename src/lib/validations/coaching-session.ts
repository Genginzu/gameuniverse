import { z } from "zod";

export const createCoachingSessionSchema = z.object({
  coachId: z.string().uuid(),
  gameId: z.string().uuid(),
  pricingId: z.string().uuid(),
  scheduledAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")
    .refine((value) => Date.parse(value) > Date.now(), "scheduledAt must be in the future"),
});

export type CreateCoachingSessionInput = z.infer<typeof createCoachingSessionSchema>;
