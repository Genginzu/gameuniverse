import { z } from "zod";

/** Schéma de validation des paramètres de requête pour la liste admin des commentaires */
export const adminCommentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z
    .enum(["created_at", "updated_at", "player_name", "character_name"])
    .default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export type AdminCommentQuery = z.infer<typeof adminCommentQuerySchema>;
