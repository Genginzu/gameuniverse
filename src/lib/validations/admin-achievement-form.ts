import { z } from "zod";

/**
 * Schéma Zod pour le formulaire admin de succès (création/modification).
 * Suit le même pattern que admin-genre-form.ts et admin-company-form.ts.
 */

export const adminAchievementFormSchema = z.object({
  key: z
    .string()
    .min(1, "La clé est requise")
    .max(100, "La clé ne peut pas dépasser 100 caractères")
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Lettres minuscules, chiffres et underscores uniquement, commençant par une lettre"
    ),
  category: z.enum(["library", "playtime", "reviews", "social", "collections"]),
  tier: z.enum(["bronze", "silver", "gold"]),
  threshold: z.number().int("Le seuil doit être un entier").positive("Le seuil doit être positif"),
  xpValue: z
    .number()
    .int("La valeur XP doit être un entier")
    .positive("La valeur XP doit être positive"),
  icon: z
    .string()
    .min(1, "L'icône est requise")
    .max(50, "L'icône ne peut pas dépasser 50 caractères"),
  nameFr: z
    .string()
    .min(1, "Le nom FR est requis")
    .max(200, "Le nom FR ne peut pas dépasser 200 caractères"),
  nameEn: z
    .string()
    .min(1, "Le nom EN est requis")
    .max(200, "Le nom EN ne peut pas dépasser 200 caractères"),
  descriptionFr: z
    .string()
    .min(1, "La description FR est requise")
    .max(500, "La description FR ne peut pas dépasser 500 caractères"),
  descriptionEn: z
    .string()
    .min(1, "La description EN est requise")
    .max(500, "La description EN ne peut pas dépasser 500 caractères"),
  sortOrder: z
    .number()
    .int("L'ordre doit être un entier")
    .min(0, "L'ordre doit être positif ou nul"),
});

export type AchievementFormData = z.infer<typeof adminAchievementFormSchema>;

// Query parameters validation for admin achievement list
export const achievementQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z
    .enum(["key", "category", "tier", "threshold", "xp_value", "name", "sort_order"])
    .default("sort_order"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
  locale: z.string().default("fr"),
});

export type AchievementQueryParams = z.infer<typeof achievementQuerySchema>;

// Validation for player achievement assign/revoke actions
export const playerAchievementActionSchema = z.object({
  userId: z.string().uuid("L'identifiant du joueur doit être un UUID valide"),
  achievementKey: z.string().min(1, "La clé du succès est requise"),
});

export type PlayerAchievementActionData = z.infer<typeof playerAchievementActionSchema>;
