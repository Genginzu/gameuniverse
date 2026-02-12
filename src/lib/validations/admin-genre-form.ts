import { z } from "zod";

/**
 * Schéma Zod pour le formulaire admin de genre (création/modification).
 * Suit le même pattern que admin-language-form.ts et admin-character-form.ts.
 */

export const genreTranslationSchema = z.object({
  language_code: z.string().min(1),
  name: z.string().min(1, "Le nom est requis").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
});

export const adminGenreFormSchema = z.object({
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(50, "Le slug ne peut pas dépasser 50 caractères")
    .regex(/^[a-z]([a-z0-9-]*[a-z0-9])?$/, "Lettres minuscules, chiffres et tirets uniquement"),
  translations: z.array(genreTranslationSchema).min(1, "Au moins une traduction est requise"),
});

export type GenreFormData = z.infer<typeof adminGenreFormSchema>;
export type GenreTranslationData = z.infer<typeof genreTranslationSchema>;

// Query parameters validation for admin genre list
export const genreQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z.enum(["slug", "name"]).default("slug"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
  locale: z.string().default("fr"),
});

export type GenreQueryParams = z.infer<typeof genreQuerySchema>;
