/**
 * IGDB game metadata (themes, modes, perspectives, franchises and series,
 * keywords, engines, websites, multiplayer modes, total rating).
 *
 * Deno port of src/lib/services/igdbMetadata.ts: same APICalypse fields,
 * same payload shape, same `set_games_metadata` RPC.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import type {
  IGDBGame,
  IGDBMultiplayerMode,
  IGDBNamedEntity,
  IGDBWebsite,
} from "./igdb-types.ts";

export const METADATA_FIELDS = [
  "themes",
  "game_modes",
  "player_perspectives",
  "multiplayer_modes",
  "franchises",
  "keywords",
  "game_engines",
  "websites",
  "igdb_rating",
] as const;

export type MetadataField = (typeof METADATA_FIELDS)[number];

const named = (field: string) => `${field}.id, ${field}.name, ${field}.slug`;

export const IGDB_METADATA_FIELDS = [
  named("themes"),
  named("game_modes"),
  named("player_perspectives"),
  named("franchise"),
  named("franchises"),
  named("collections"),
  named("keywords"),
  named("game_engines"),
  "websites.url, websites.type, websites.trusted",
  "multiplayer_modes.platform, multiplayer_modes.campaigncoop, multiplayer_modes.dropin, " +
    "multiplayer_modes.lancoop, multiplayer_modes.offlinecoop, multiplayer_modes.offlinecoopmax, " +
    "multiplayer_modes.offlinemax, multiplayer_modes.onlinecoop, multiplayer_modes.onlinecoopmax, " +
    "multiplayer_modes.onlinemax, multiplayer_modes.splitscreen, multiplayer_modes.splitscreenonline",
  "total_rating, total_rating_count",
].join(", ");

/** Webhook payload keys driving each metadata field (registry webhookPayloadKeys). */
export const METADATA_PAYLOAD_KEYS: Record<MetadataField, readonly string[]> = {
  themes: ["themes"],
  game_modes: ["game_modes"],
  player_perspectives: ["player_perspectives"],
  multiplayer_modes: ["multiplayer_modes"],
  franchises: ["franchise", "franchises", "collections"],
  keywords: ["keywords"],
  game_engines: ["game_engines"],
  websites: ["websites"],
  igdb_rating: ["total_rating", "total_rating_count"],
};

type NamedEntry = number | IGDBNamedEntity;

const entryId = (entry: NamedEntry) => (typeof entry === "number" ? entry : entry.id);

function mergeFranchises(game: IGDBGame): NamedEntry[] {
  const all = [...(game.franchise ? [game.franchise] : []), ...(game.franchises ?? [])];
  const seen = new Set<number>();
  return all.filter((entry) => {
    const id = entryId(entry);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function websitesOf(game: IGDBGame) {
  return (game.websites ?? [])
    .filter((site): site is IGDBWebsite => typeof site === "object" && Boolean(site.url))
    .map((site) => ({ url: site.url as string, type: site.type ?? null, trusted: Boolean(site.trusted) }));
}

function multiplayerModesOf(game: IGDBGame): IGDBMultiplayerMode[] {
  return (game.multiplayer_modes ?? []).filter(
    (mode): mode is IGDBMultiplayerMode => typeof mode === "object",
  );
}

const PICKERS: Record<MetadataField, (game: IGDBGame) => Record<string, unknown>> = {
  themes: (game) => ({ themes: game.themes ?? [] }),
  game_modes: (game) => ({ game_modes: game.game_modes ?? [] }),
  player_perspectives: (game) => ({ player_perspectives: game.player_perspectives ?? [] }),
  multiplayer_modes: (game) => ({ multiplayer_modes: multiplayerModesOf(game) }),
  franchises: (game) => ({ franchises: mergeFranchises(game), collections: game.collections ?? [] }),
  keywords: (game) => ({ keywords: game.keywords ?? [] }),
  game_engines: (game) => ({ game_engines: game.game_engines ?? [] }),
  websites: (game) => ({ websites: websitesOf(game) }),
  igdb_rating: (game) => ({
    rating: {
      total_rating: game.total_rating ?? null,
      total_rating_count: game.total_rating_count ?? null,
    },
  }),
};

export function toGameMetadata(
  game: IGDBGame,
  fields: readonly MetadataField[] = METADATA_FIELDS,
): Record<string, unknown> {
  return Object.assign({}, ...fields.map((field) => PICKERS[field](game)));
}

/** True when the IGDB themes include "Erotic" (id 42), ids or expanded objects. */
export function isAdultThemes(themes: NamedEntry[] | undefined): boolean {
  return (themes ?? []).some((theme) => entryId(theme) === 42);
}

/** Writes the given metadata fields of one game (all fields by default). */
export async function saveGameMetadata(
  supabase: SupabaseClient,
  gameId: string,
  game: IGDBGame,
  fields: readonly MetadataField[] = METADATA_FIELDS,
): Promise<void> {
  const { error } = await supabase.rpc("set_games_metadata", {
    p_items: [{ game_id: gameId, metadata: toGameMetadata(game, fields) }],
  });
  if (error) throw new Error(`Failed to save game metadata: ${error.message}`);
}
