import { z } from "zod";

/**
 * Schéma Zod pour le formulaire admin de plateforme (création/modification).
 * Suit le même pattern que admin-genre-form.ts.
 */

export const platformTranslationSchema = z.object({
  language_code: z.string().min(1),
  name: z.string().min(1, "Le nom est requis").max(100),
  abbreviation: z.string().max(20).optional().or(z.literal("")),
});

export const adminPlatformFormSchema = z
  .object({
    slug: z
      .string()
      .min(2, "Le slug doit contenir au moins 2 caractères")
      .max(50, "Le slug ne peut pas dépasser 50 caractères")
      .regex(/^[a-z]([a-z0-9-]*[a-z0-9])?$/, "Lettres minuscules, chiffres et tirets uniquement"),
    iconUrl: z.string().optional().or(z.literal("")),
    translations: z.array(platformTranslationSchema),
  })
  .refine((data) => data.translations.some((t) => t.name && t.name.trim().length > 0), {
    message: "Au moins un nom (FR ou EN) est requis",
    path: ["translations"],
  });

export type PlatformFormData = z.infer<typeof adminPlatformFormSchema>;
export type PlatformTranslationData = z.infer<typeof platformTranslationSchema>;

/** Validation des query params pour le listing admin des plateformes */
export const platformQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z.enum(["slug", "name", "game_count"]).default("slug"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
  locale: z.string().default("fr"),
});

export type PlatformQueryParams = z.infer<typeof platformQuerySchema>;
