import { z } from "zod";

// Base game validation schema
export const gameBaseSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255, "Slug must be less than 255 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  cover_image_url: z.string().url("Invalid cover image URL").optional().nullable(),
  background_image_url: z.string().url("Invalid background image URL").optional().nullable(),
  background_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional()
    .nullable(),
  accent_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional()
    .nullable(),
  label_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional()
    .nullable(),
  text_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional()
    .nullable(),
  release_date: z.string().date("Invalid release date").optional().nullable(),
  metascore: z
    .number()
    .int()
    .min(0)
    .max(100, "Metascore must be between 0 and 100")
    .optional()
    .nullable(),
  playtime_hastily: z.number().min(0).optional().nullable(),
  playtime_normally: z.number().min(0).optional().nullable(),
  playtime_completely: z.number().min(0).optional().nullable(),
  system_requirements: z.record(z.string(), z.any()).optional().nullable(),
});

// Game translation validation schema
export const gameTranslationSchema = z.object({
  language_code: z.string().length(2, "Language code must be 2 characters"),
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  description: z
    .string()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .nullable(),
});

// Game company relation validation schema
export const gameCompanySchema = z.object({
  company_id: z.string().uuid("Invalid company ID"),
  role: z.enum(["developer", "publisher"], {
    message: "Role must be either 'developer' or 'publisher'",
  }),
  is_primary: z.boolean().default(false),
});

// Game genre relation validation schema
export const gameGenreSchema = z.object({
  genre_id: z.string().uuid("Invalid genre ID"),
});

// Game platform relation validation schema
export const gamePlatformLinkSchema = z.object({
  platform_id: z.string().uuid("Invalid platform ID"),
});

// Media validation schemas
export const gameScreenshotSchema = z.object({
  url: z.string().url("Invalid screenshot URL"),
  alt_text: z.string().max(255, "Alt text must be less than 255 characters").optional().nullable(),
  caption: z.string().max(500, "Caption must be less than 500 characters").optional().nullable(),
  display_order: z.number().int().min(0).optional().nullable(),
  is_featured: z.boolean().default(false),
});

export const gameArtworkSchema = z.object({
  url: z.string().url("Invalid artwork URL"),
  alt_text: z.string().max(255, "Alt text must be less than 255 characters").optional().nullable(),
  caption: z.string().max(500, "Caption must be less than 500 characters").optional().nullable(),
  artwork_type: z
    .string()
    .max(50, "Artwork type must be less than 50 characters")
    .optional()
    .nullable(),
  display_order: z.number().int().min(0).optional().nullable(),
  is_featured: z.boolean().default(false),
});

export const gameVideoSchema = z.object({
  title: z
    .string()
    .min(1, "Video title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .nullable(),
  url: z.string().url("Invalid video URL"),
  thumbnail_url: z.string().url("Invalid thumbnail URL").optional().nullable(),
  video_type: z
    .string()
    .max(50, "Video type must be less than 50 characters")
    .optional()
    .nullable(),
  duration_seconds: z.number().int().min(0).optional().nullable(),
  display_order: z.number().int().min(0).optional().nullable(),
  is_featured: z.boolean().default(false),
});

// Pricing validation schema
export const gamePriceSchema = z.object({
  store_id: z.string().uuid("Invalid store ID"),
  price: z.number().min(0, "Price must be non-negative"),
  currency: z.string().length(3, "Currency must be 3 characters (ISO 4217)"),
  platform: z
    .string()
    .min(1, "Platform is required")
    .max(100, "Platform must be less than 100 characters"),
  store_url: z.string().url("Invalid store URL").optional().nullable(),
  is_available: z.boolean().default(true),
});

export const gameRatingLinkSchema = z.object({
  rating_id: z.string().uuid("Invalid rating ID"),
  is_primary: z.boolean().default(false),
  content_descriptors: z.array(z.string().uuid()).default([]),
});

export const gameVersionTranslationSchema = z.object({
  language_code: z.string().length(2),
  title: z.string().max(255).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
});

export const gameVersionSchema = z.object({
  version_title: z
    .string()
    .min(1, "Version title is required")
    .max(255, "Version title must be less than 255 characters"),
  description: z
    .string()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .nullable(),
  cover_image_url: z.string().url("Invalid cover image URL").optional().nullable(),
  display_order: z.number().int().min(0).optional().nullable(),
  translations: z.array(gameVersionTranslationSchema).optional(),
});

export const gameLanguageSchema = z.object({
  language_code: z.string().min(1).max(10, "Language code must be less than 10 characters"),
  language_name: z.string().min(1, "Language name is required").max(100),
  has_audio: z.boolean().default(false),
  has_subtitles: z.boolean().default(false),
  has_interface: z.boolean().default(false),
});

// Music validation schema
export const gameMusicSchema = z.object({
  composer: z.string().max(500).optional().nullable(),
  spotify_embed_url: z.string().url("Invalid Spotify URL").optional().nullable(),
  youtube_video_url: z.string().url("Invalid YouTube URL").optional().nullable(),
});

// Complete game creation schema
export const createGameSchema = z.object({
  game: gameBaseSchema,
  translations: z.array(gameTranslationSchema).min(1, "At least one translation is required"),
  companies: z.array(gameCompanySchema).min(1, "At least one company is required"),
  genres: z.array(gameGenreSchema).min(1, "At least one genre is required"),
  screenshots: z.array(gameScreenshotSchema).optional(),
  artwork: z.array(gameArtworkSchema).optional(),
  videos: z.array(gameVideoSchema).optional(),
  prices: z.array(gamePriceSchema).optional(),
  age_ratings: z.array(gameRatingLinkSchema).optional(),
  versions: z.array(gameVersionSchema).optional(),
  languages: z.array(gameLanguageSchema).optional(),
  music: gameMusicSchema.optional(),
  game_platforms: z.array(gamePlatformLinkSchema).optional(),
});

// Game update schema (all fields optional except ID)
export const updateGameSchema = z.object({
  id: z.string().uuid("Invalid game ID"),
  game: gameBaseSchema.partial(),
  translations: z.array(gameTranslationSchema).optional(),
  companies: z.array(gameCompanySchema).optional(),
  genres: z.array(gameGenreSchema).optional(),
  screenshots: z.array(gameScreenshotSchema).optional(),
  artwork: z.array(gameArtworkSchema).optional(),
  videos: z.array(gameVideoSchema).optional(),
  prices: z.array(gamePriceSchema).optional(),
  age_ratings: z.array(gameRatingLinkSchema).optional(),
  versions: z.array(gameVersionSchema).optional(),
  languages: z.array(gameLanguageSchema).optional(),
  music: gameMusicSchema.optional(),
  game_platforms: z.array(gamePlatformLinkSchema).optional(),
});

// Bulk operations schema
export const bulkGameOperationSchema = z.object({
  operation: z.enum(["delete", "update"], {
    message: "Operation must be either 'delete' or 'update'",
  }),
  game_ids: z.array(z.string().uuid("Invalid game ID")).min(1, "At least one game ID is required"),
  data: z.record(z.string(), z.any()).optional(), // For bulk updates
});

// Query parameters validation
export const adminGameQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  genre: z.string().optional(),
  company: z.string().optional(),
  sort_by: z.enum(["created_at", "updated_at", "title", "release_date"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
  locale: z.string().length(2).default("fr"),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type UpdateGameInput = z.infer<typeof updateGameSchema>;
export type BulkGameOperationInput = z.infer<typeof bulkGameOperationSchema>;
export type AdminGameQuery = z.infer<typeof adminGameQuerySchema>;
