import { z } from "zod";

/** Les 10 types d'entités supportés */
export const entityTypeSchema = z.enum([
  "games",
  "characters",
  "genres",
  "companies",
  "platforms",
  "character_roles",
  "genders",
  "species",
  "content_descriptors",
  "ratings",
]);

/** Paramètres de la route GET /api/admin/translations/missing */
export const missingQuerySchema = z.object({
  type: entityTypeSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

/** Corps de la route POST /api/admin/translations/translate */
export const translateBodySchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().uuid(),
  targetLang: z.string().length(2),
  saveToDb: z.boolean().default(true),
});

/** Corps de la route POST /api/admin/translations/translate-batch */
export const translateBatchBodySchema = z.object({
  entityType: entityTypeSchema,
  entityIds: z.array(z.string().uuid()).min(1).max(50),
  targetLang: z.string().length(2),
});

/** Corps de la route PUT /api/admin/translations/save */
export const saveTranslationBodySchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().uuid(),
  targetLang: z.string().length(2),
  translations: z.record(z.string(), z.string()),
});

// Inferred types
export type EntityTypeSchema = z.infer<typeof entityTypeSchema>;
export type MissingQuery = z.infer<typeof missingQuerySchema>;
export type TranslateBody = z.infer<typeof translateBodySchema>;
export type TranslateBatchBody = z.infer<typeof translateBatchBodySchema>;
export type SaveTranslationBody = z.infer<typeof saveTranslationBodySchema>;
