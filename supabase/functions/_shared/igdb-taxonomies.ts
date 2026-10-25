/**
 * IGDB taxonomies (themes, game modes, player perspectives, franchises).
 *
 * Deno port of src/lib/services/igdbTaxonomies.ts: same APICalypse fields,
 * same payload shape, same `set_games_taxonomies` RPC.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import type { IGDBGame, IGDBNamedEntity } from "./igdb-types.ts";

export const IGDB_TAXONOMY_FIELDS =
  "themes.id, themes.name, themes.slug, " +
  "game_modes.id, game_modes.name, game_modes.slug, " +
  "player_perspectives.id, player_perspectives.name, player_perspectives.slug, " +
  "franchise.id, franchise.name, franchise.slug, " +
  "franchises.id, franchises.name, franchises.slug";

export const IGDB_TAXONOMY_PAYLOAD_KEYS = [
  "themes",
  "game_modes",
  "player_perspectives",
  "franchise",
  "franchises",
] as const;

type TaxonomyEntry = number | IGDBNamedEntity;

const entryId = (entry: TaxonomyEntry) => (typeof entry === "number" ? entry : entry.id);

function mergeFranchises(game: IGDBGame): TaxonomyEntry[] {
  const all = [...(game.franchise ? [game.franchise] : []), ...(game.franchises ?? [])];
  const seen = new Set<number>();
  return all.filter((entry) => {
    const id = entryId(entry);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function toGameTaxonomies(game: IGDBGame) {
  return {
    themes: game.themes ?? [],
    game_modes: game.game_modes ?? [],
    player_perspectives: game.player_perspectives ?? [],
    franchises: mergeFranchises(game),
  };
}

export function hasTaxonomyPayload(payload: Record<string, unknown>): boolean {
  return IGDB_TAXONOMY_PAYLOAD_KEYS.some((key) => key in payload);
}

/** True when the IGDB themes include "Erotic" (id 42), ids or expanded objects. */
export function isAdultThemes(themes: TaxonomyEntry[] | undefined): boolean {
  return (themes ?? []).some((theme) => entryId(theme) === 42);
}

export async function saveGameTaxonomies(
  supabase: SupabaseClient,
  gameId: string,
  game: IGDBGame,
): Promise<void> {
  const { error } = await supabase.rpc("set_games_taxonomies", {
    p_items: [{ game_id: gameId, taxonomies: toGameTaxonomies(game) }],
  });
  if (error) throw new Error(`Failed to save game taxonomies: ${error.message}`);
}
