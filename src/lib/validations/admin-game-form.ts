import { z } from "zod";

/**
 * Simplified Zod schema for the admin game form (create/edit).
 * Reuses base field rules from game.ts but tailored for the form UI.
 */

export const adminGameTranslationSchema = z.object({
  language_code: z.string().length(2, "Language code must be 2 characters"),
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  description: z
    .string()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .or(z.literal("")),
});

export const adminGameGenreSchema = z.object({
  genre_id: z.string().uuid("Invalid genre ID"),
});

export const adminGameCompanySchema = z.object({
  company_id: z.string().uuid("Invalid company ID"),
  role: z.enum(["developer", "publisher"], {
    message: "Role must be either 'developer' or 'publisher'",
  }),
  is_primary: z.boolean(),
});

export const adminGameFormSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255, "Slug must be less than 255 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  translations: z
    .array(adminGameTranslationSchema)
    .min(1, "At least one translation is required")
    .refine(
      (translations) => translations.some((t) => t.title.trim().length > 0),
      "At least one translation must have a title"
    ),
  cover_image_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  release_date: z.string().optional().or(z.literal("")),
  genres: z.array(adminGameGenreSchema).min(1, "At least one genre is required"),
  companies: z.array(adminGameCompanySchema).min(1, "At least one company is required"),
});

export type AdminGameFormData = z.infer<typeof adminGameFormSchema>;
export type AdminGameTranslation = z.infer<typeof adminGameTranslationSchema>;
export type AdminGameGenre = z.infer<typeof adminGameGenreSchema>;
export type AdminGameCompany = z.infer<typeof adminGameCompanySchema>;
