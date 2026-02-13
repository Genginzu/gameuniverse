import { z } from "zod";

/**
 * Schéma Zod pour le formulaire admin de personnage (création/modification).
 * Suit le même pattern que admin-game-form.ts.
 */

export const adminCharacterTranslationSchema = z.object({
  language_code: z.string().length(2, "Language code must be 2 characters"),
  name: z.string().max(255, "Name must be less than 255 characters").optional().or(z.literal("")),
  role: z.string().max(100, "Role must be less than 100 characters").optional().or(z.literal("")),
  description: z
    .string()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .or(z.literal("")),
  biography: z
    .string()
    .max(10000, "Biography must be less than 10000 characters")
    .optional()
    .or(z.literal("")),
  weapons: z
    .string()
    .max(5000, "Weapons must be less than 5000 characters")
    .optional()
    .or(z.literal("")),
});

export const adminCharacterGameSchema = z.object({
  game_id: z.string().uuid("Invalid game ID"),
  is_primary: z.boolean(),
});

export const RELATIONSHIP_TYPES = [
  "ally",
  "enemy",
  "rival",
  "family",
  "romantic",
  "mentor",
  "friend",
] as const;

export const adminCharacterRelationshipSchema = z.object({
  related_character_id: z.string().uuid("Invalid character ID"),
  relationship_type: z.enum(RELATIONSHIP_TYPES, {
    message: "Invalid relationship type",
  }),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
});

export const adminCharacterMediaSchema = z.object({
  type: z.enum(["screenshot", "artwork", "video"], {
    message: "Type must be 'screenshot', 'artwork', or 'video'",
  }),
  url: z.string().url("Invalid URL"),
  thumbnail_url: z.string().url("Invalid URL").or(z.literal("")).optional(),
  title: z.string().max(255, "Title must be less than 255 characters").optional().or(z.literal("")),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  alt_text: z
    .string()
    .max(255, "Alt text must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  is_featured: z.boolean().default(false),
  display_order: z.number().int().min(0).optional(),
});

export const adminCharacterFormSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255, "Slug must be less than 255 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  background_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Background color must be a valid hex color (e.g. #0f172a)")
    .or(z.literal(""))
    .optional(),
  main_image_url: z.string().url("Invalid URL").or(z.literal("")).optional(),
  background_image_url: z.string().url("Invalid URL").or(z.literal("")).optional(),
  translations: z
    .array(adminCharacterTranslationSchema)
    .min(1, "At least one translation is required")
    .refine(
      (translations) => translations.some((t) => (t.name ?? "").trim().length > 0),
      "At least one translation must have a name"
    ),
  games: z.array(adminCharacterGameSchema).default([]),
  relationships: z.array(adminCharacterRelationshipSchema).default([]),
  media: z.array(adminCharacterMediaSchema).default([]),
});

export type AdminCharacterFormData = z.infer<typeof adminCharacterFormSchema>;
export type AdminCharacterTranslation = z.infer<typeof adminCharacterTranslationSchema>;
export type AdminCharacterGame = z.infer<typeof adminCharacterGameSchema>;
export type AdminCharacterRelationship = z.infer<typeof adminCharacterRelationshipSchema>;
export type AdminCharacterMedia = z.infer<typeof adminCharacterMediaSchema>;

// Query parameters validation for admin character list
export const adminCharacterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z.enum(["created_at", "updated_at", "name"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
  locale: z.string().length(2).default("fr"),
});

export type AdminCharacterQuery = z.infer<typeof adminCharacterQuerySchema>;
