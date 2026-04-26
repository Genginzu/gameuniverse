import { z } from "zod";

/**
 * Simplified Zod schema for the admin game form (create/edit).
 * Reuses base field rules from game.ts but tailored for the form UI.
 */

export const adminGameTranslationSchema = z.object({
  language_code: z.string().length(2, "Language code must be 2 characters"),
  title: z.string().max(255, "Title must be less than 255 characters").optional().or(z.literal("")),
  description: z
    .string()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .or(z.literal("")),
  storyline: z
    .string()
    .max(10000, "Storyline must be less than 10000 characters")
    .optional()
    .or(z.literal(""))
    .nullable(),
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

export const adminGameScreenshotSchema = z.object({
  url: z.string().url("Invalid URL"),
  alt_text: z.string().max(255).optional().or(z.literal("")),
  caption: z.string().max(500).optional().or(z.literal("")),
  display_order: z.number().int().min(0).optional().nullable(),
  is_featured: z.boolean().default(false),
});

export const adminGameArtworkSchema = z.object({
  url: z.string().url("Invalid URL"),
  alt_text: z.string().max(255).optional().or(z.literal("")),
  caption: z.string().max(500).optional().or(z.literal("")),
  artwork_type: z.string().max(50).optional().or(z.literal("")),
  display_order: z.number().int().min(0).optional().nullable(),
  is_featured: z.boolean().default(false),
});

export const adminGameVersionTranslationSchema = z.object({
  language_code: z.string().length(2, "Language code must be 2 characters"),
  title: z.string().max(255).optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),
});

export const adminGameVersionSchema = z.object({
  version_title: z.string().min(1, "Version title is required").max(255),
  description: z.string().max(5000).optional().or(z.literal("")),
  cover_image_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  display_order: z.number().int().min(0).optional().nullable(),
  translations: z.array(adminGameVersionTranslationSchema).default([]),
});

export const adminGameLanguageSchema = z.object({
  language_code: z.string().min(1).max(10),
  language_name: z.string().min(1).max(100),
  has_audio: z.boolean().default(false),
  has_subtitles: z.boolean().default(false),
  has_interface: z.boolean().default(false),
});

export const adminGamePriceSchema = z.object({
  store_id: z.string().uuid("Invalid store ID"),
  price: z.coerce.number().min(0, "Price must be positive"),
  currency: z.string().min(1, "Currency is required").max(3),
  platform: z.string().min(1, "Platform is required"),
  store_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  is_available: z.boolean().default(true),
});

export const adminGameRatingSchema = z.object({
  rating_id: z.string().uuid("Invalid rating ID"),
  is_primary: z.boolean().default(false),
  content_descriptors: z.array(z.string().uuid()).default([]),
});

export const adminGameVideoSchema = z.object({
  url: z.string().url("Invalid URL"),
  title: z.string().max(255).optional().or(z.literal("")),
  thumbnail_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  video_type: z.string().max(50).optional().or(z.literal("")),
  display_order: z.number().int().min(0).optional().nullable(),
  is_featured: z.boolean().default(false),
});

export const adminGamePlatformSchema = z.object({
  platform_id: z.string().uuid("Invalid platform ID"),
});

export const adminGameFormSchema = z.object({
  slug: z.string().max(255, "Slug must be less than 255 characters").optional().or(z.literal("")),
  translations: z
    .array(adminGameTranslationSchema)
    .min(1, "At least one translation is required")
    .refine(
      (translations) => translations.some((t) => (t.title ?? "").trim().length > 0),
      "At least one translation must have a title"
    ),
  cover_image_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  background_image_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  release_date: z.string().optional().or(z.literal("")),
  metascore: z.coerce
    .number()
    .int()
    .min(0, "Metascore must be between 0 and 100")
    .max(100, "Metascore must be between 0 and 100")
    .optional()
    .nullable()
    .or(z.literal("")),
  playtime_hastily: z.coerce.number().min(0).optional().nullable().or(z.literal("")),
  playtime_normally: z.coerce.number().min(0).optional().nullable().or(z.literal("")),
  playtime_completely: z.coerce.number().min(0).optional().nullable().or(z.literal("")),
  background_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional()
    .or(z.literal("")),
  accent_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional()
    .or(z.literal("")),
  label_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional()
    .or(z.literal("")),
  text_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional()
    .or(z.literal("")),
  screenshots: z.array(adminGameScreenshotSchema).default([]),
  artwork: z.array(adminGameArtworkSchema).default([]),
  age_ratings: z.array(adminGameRatingSchema).default([]),
  versions: z.array(adminGameVersionSchema).default([]),
  languages: z.array(adminGameLanguageSchema).default([]),
  prices: z.array(adminGamePriceSchema).default([]),
  genres: z.array(adminGameGenreSchema).min(1, "At least one genre is required"),
  companies: z.array(adminGameCompanySchema).default([]),
  game_platforms: z.array(adminGamePlatformSchema).default([]),
  videos: z.array(adminGameVideoSchema).default([]),
  music_composer: z.string().max(500).optional().or(z.literal("")),
  music_spotify_embed_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  music_youtube_video_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  is_esport: z.boolean().default(false),
});

export type AdminGameFormData = z.infer<typeof adminGameFormSchema>;
export type AdminGameTranslation = z.infer<typeof adminGameTranslationSchema>;
export type AdminGameGenre = z.infer<typeof adminGameGenreSchema>;
export type AdminGameCompany = z.infer<typeof adminGameCompanySchema>;
export type AdminGameScreenshot = z.infer<typeof adminGameScreenshotSchema>;
export type AdminGameArtwork = z.infer<typeof adminGameArtworkSchema>;
export type AdminGameRating = z.infer<typeof adminGameRatingSchema>;
export type AdminGameVersion = z.infer<typeof adminGameVersionSchema>;
export type AdminGameVersionTranslation = z.infer<typeof adminGameVersionTranslationSchema>;
export type AdminGameLanguage = z.infer<typeof adminGameLanguageSchema>;
export type AdminGamePrice = z.infer<typeof adminGamePriceSchema>;
export type AdminGameVideo = z.infer<typeof adminGameVideoSchema>;
export type AdminGamePlatform = z.infer<typeof adminGamePlatformSchema>;
