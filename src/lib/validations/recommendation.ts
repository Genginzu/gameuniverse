import { z } from "zod";

import { MAX_RECOMMENDATION_LIMIT } from "@/lib/services/recommendationService";

/** `?limit=&locale=` of the recommendation routes; invalid values fall back to defaults. */
export const recommendationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_RECOMMENDATION_LIMIT).optional().catch(undefined),
  locale: z.enum(["fr", "en"]).optional().catch(undefined),
});

export const recommendationDismissalSchema = z.object({
  gameId: z.uuid(),
});

export const recommendationDismissalParamsSchema = z.object({
  gameId: z.uuid(),
});
