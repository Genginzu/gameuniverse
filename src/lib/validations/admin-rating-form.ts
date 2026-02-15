import { z } from "zod";

export const ratingTranslationSchema = z.object({
  language_code: z.string().min(1, "Le code de langue est requis"),
  description: z
    .string()
    .min(1, "La description est requise")
    .max(500, "La description ne peut pas dépasser 500 caractères"),
});

export const adminRatingFormSchema = z.object({
  code: z
    .string()
    .min(1, "Le code est requis")
    .max(10, "Le code ne peut pas dépasser 10 caractères"),
  display_name: z
    .string()
    .min(1, "Le nom d'affichage est requis")
    .max(50, "Le nom d'affichage ne peut pas dépasser 50 caractères"),
  minimum_age: z.coerce
    .number()
    .int("L'âge minimum doit être un entier")
    .min(0, "L'âge minimum ne peut pas être négatif"),
  color_hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format #RRGGBB")
    .optional()
    .or(z.literal("")),
  icon_url: z.string().url("L'URL de l'icône est invalide").optional().or(z.literal("")),
  sort_order: z.coerce
    .number()
    .int("L'ordre de tri doit être un entier")
    .min(0, "L'ordre de tri ne peut pas être négatif")
    .default(0),
  translations: z.array(ratingTranslationSchema).default([]),
});

export type RatingTranslationData = z.infer<typeof ratingTranslationSchema>;
export type RatingFormData = z.infer<typeof adminRatingFormSchema>;
