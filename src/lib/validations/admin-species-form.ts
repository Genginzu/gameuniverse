import { z } from "zod";

/**
 * Schéma Zod pour le formulaire admin de species (création/modification).
 * Suit le même pattern que admin-genre-form.ts.
 * Les species n'ont pas de champ description (uniquement name).
 */

export const speciesTranslationSchema = z.object({
  language_code: z.string().min(1),
  name: z.string().min(1, "Le nom est requis").max(255),
});

export const adminSpeciesFormSchema = z.object({
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(50, "Le slug ne peut pas dépasser 50 caractères")
    .regex(/^[a-z]([a-z0-9-]*[a-z0-9])?$/, "Lettres minuscules, chiffres et tirets uniquement"),
  translations: z.array(speciesTranslationSchema).min(1, "Au moins une traduction est requise"),
});

export type SpeciesFormData = z.infer<typeof adminSpeciesFormSchema>;
export type SpeciesTranslationData = z.infer<typeof speciesTranslationSchema>;

// Query parameters validation for admin species list
export const speciesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z.enum(["slug", "name"]).default("slug"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
  locale: z.string().default("fr"),
});

export type SpeciesQueryParams = z.infer<typeof speciesQuerySchema>;
