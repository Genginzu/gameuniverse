import { z } from "zod";

/**
 * Schéma Zod pour le formulaire admin de gender (création/modification).
 * Suit le même pattern que admin-genre-form.ts.
 * Les genders n'ont pas de champ description (uniquement name).
 */

export const genderTranslationSchema = z.object({
  language_code: z.string().min(1),
  name: z.string().min(1, "Le nom est requis").max(255),
});

export const adminGenderFormSchema = z.object({
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(50, "Le slug ne peut pas dépasser 50 caractères")
    .regex(/^[a-z]([a-z0-9-]*[a-z0-9])?$/, "Lettres minuscules, chiffres et tirets uniquement"),
  translations: z.array(genderTranslationSchema).min(1, "Au moins une traduction est requise"),
});

export type GenderFormData = z.infer<typeof adminGenderFormSchema>;
export type GenderTranslationData = z.infer<typeof genderTranslationSchema>;

// Query parameters validation for admin gender list
export const genderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z.enum(["slug", "name"]).default("slug"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
  locale: z.string().default("fr"),
});

export type GenderQueryParams = z.infer<typeof genderQuerySchema>;
