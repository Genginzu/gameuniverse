import { z } from "zod";

export const adminRatingSystemFormSchema = z.object({
  code: z
    .string()
    .min(1, "Le code est requis")
    .max(10, "Le code ne peut pas dépasser 10 caractères")
    .regex(
      /^[A-Z][A-Z0-9_]*$/,
      "Le code doit commencer par une majuscule et contenir uniquement des majuscules, chiffres et underscores"
    ),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .or(z.literal("")),
  country_codes: z.array(z.string().length(2)).default([]),
  website_url: z.string().url("L'URL du site web est invalide").optional().or(z.literal("")),
});

export type RatingSystemFormData = z.infer<typeof adminRatingSystemFormSchema>;

// Query parameters validation for admin rating system list
export const ratingSystemQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z.enum(["code", "name"]).default("code"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

export type RatingSystemQueryParams = z.infer<typeof ratingSystemQuerySchema>;
