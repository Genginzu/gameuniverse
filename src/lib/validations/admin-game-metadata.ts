import { z } from "zod";

/**
 * Admin edition of the IGDB metadata of a game (themes, modes, perspectives,
 * franchises and series, engines, keywords, websites, multiplayer modes,
 * IGDB rating). Shared by the admin form schema and the admin API schemas.
 */

const uuid = (message: string) => z.string().uuid(message);
/** Display name kept in the form for chips; never written. */
const label = z.string().max(255).optional();

export const adminGameThemeSchema = z.object({ theme_id: uuid("Invalid theme ID") });
export const adminGameModeSchema = z.object({ game_mode_id: uuid("Invalid game mode ID") });
export const adminGamePerspectiveSchema = z.object({
  player_perspective_id: uuid("Invalid perspective ID"),
});
export const adminGameFranchiseSchema = z.object({
  franchise_id: uuid("Invalid franchise ID"),
  name: label,
});
export const adminGameSeriesSchema = z.object({ series_id: uuid("Invalid series ID"), name: label });
export const adminGameEngineSchema = z.object({
  game_engine_id: uuid("Invalid engine ID"),
  name: label,
});
export const adminGameKeywordSchema = z.object({ keyword_id: uuid("Invalid keyword ID"), name: label });

export const adminGameWebsiteSchema = z.object({
  url: z.string().url("Invalid URL").max(2000),
  type_id: z.number().int().positive().nullable().default(null),
  trusted: z.boolean().default(false),
});

const maxPlayers = z.coerce.number().int().min(1).max(10000).nullable().default(null);

export const adminGameMultiplayerModeSchema = z.object({
  igdb_platform_id: z.number().int().positive().nullable().default(null),
  campaign_coop: z.boolean().default(false),
  drop_in: z.boolean().default(false),
  lan_coop: z.boolean().default(false),
  offline_coop: z.boolean().default(false),
  offline_coop_max: maxPlayers,
  offline_max: maxPlayers,
  online_coop: z.boolean().default(false),
  online_coop_max: maxPlayers,
  online_max: maxPlayers,
  splitscreen: z.boolean().default(false),
  splitscreen_online: z.boolean().default(false),
});

/** Same convention as metascore: "" for an emptied input. */
const igdbRating = z.coerce.number().min(0).max(100).optional().nullable().or(z.literal(""));
const igdbRatingCount = z.coerce.number().int().min(0).optional().nullable().or(z.literal(""));

/** Fields added to the admin game form. */
export const adminGameMetadataFields = {
  themes: z.array(adminGameThemeSchema).default([]),
  game_modes: z.array(adminGameModeSchema).default([]),
  player_perspectives: z.array(adminGamePerspectiveSchema).default([]),
  franchises: z.array(adminGameFranchiseSchema).default([]),
  series: z.array(adminGameSeriesSchema).default([]),
  game_engines: z.array(adminGameEngineSchema).default([]),
  keywords: z.array(adminGameKeywordSchema).default([]),
  websites: z.array(adminGameWebsiteSchema).default([]),
  multiplayer_modes: z.array(adminGameMultiplayerModeSchema).default([]),
  igdb_total_rating: igdbRating,
  igdb_total_rating_count: igdbRatingCount,
};

/** Same fields for the admin API: absent = untouched. */
export const adminGameMetadataUpdateFields = {
  themes: z.array(adminGameThemeSchema).optional(),
  game_modes: z.array(adminGameModeSchema).optional(),
  player_perspectives: z.array(adminGamePerspectiveSchema).optional(),
  franchises: z.array(adminGameFranchiseSchema).optional(),
  series: z.array(adminGameSeriesSchema).optional(),
  game_engines: z.array(adminGameEngineSchema).optional(),
  keywords: z.array(adminGameKeywordSchema).optional(),
  websites: z.array(adminGameWebsiteSchema).optional(),
  multiplayer_modes: z.array(adminGameMultiplayerModeSchema).optional(),
  igdb_total_rating: igdbRating,
  igdb_total_rating_count: igdbRatingCount,
};

export type AdminGameWebsite = z.infer<typeof adminGameWebsiteSchema>;
export type AdminGameMultiplayerMode = z.infer<typeof adminGameMultiplayerModeSchema>;
