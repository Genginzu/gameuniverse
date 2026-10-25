/**
 * IGDB taxonomies (themes, game modes, player perspectives, franchises) used
 * by the recommendation engine as content features.
 *
 * All writers (sync, import, webhook, backfill) go through the
 * `set_games_taxonomies` RPC, which upserts the reference rows by IGDB id and
 * replaces the game links in one transaction per game.
 */

import type { IGDBGame, IGDBNamedEntity } from "@/types/igdb";

/** APICalypse fields expanding every taxonomy of `/games`. */
export const IGDB_TAXONOMY_FIELDS =
  "themes.id, themes.name, themes.slug, " +
  "game_modes.id, game_modes.name, game_modes.slug, " +
  "player_perspectives.id, player_perspectives.name, player_perspectives.slug, " +
  "franchise.id, franchise.name, franchise.slug, " +
  "franchises.id, franchises.name, franchises.slug";

type TaxonomyEntry = number | IGDBNamedEntity;

export interface GameTaxonomies {
  themes: TaxonomyEntry[];
  game_modes: TaxonomyEntry[];
  player_perspectives: TaxonomyEntry[];
  franchises: TaxonomyEntry[];
}

export interface GameTaxonomiesItem {
  game_id: string;
  taxonomies: GameTaxonomies;
}

function entryId(entry: TaxonomyEntry): number {
  return typeof entry === "number" ? entry : entry.id;
}

/** Main franchise first, then the other franchises, without duplicates. */
function mergeFranchises(game: Pick<IGDBGame, "franchise" | "franchises">): TaxonomyEntry[] {
  const all = [...(game.franchise ? [game.franchise] : []), ...(game.franchises ?? [])];
  const seen = new Set<number>();
  return all.filter((entry) => {
    const id = entryId(entry);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** Full taxonomy payload of a game fetched with `IGDB_TAXONOMY_FIELDS`. */
export function toGameTaxonomies(game: IGDBGame): GameTaxonomies {
  return {
    themes: game.themes ?? [],
    game_modes: game.game_modes ?? [],
    player_perspectives: game.player_perspectives ?? [],
    franchises: mergeFranchises(game),
  };
}

/** Minimal client surface: any Supabase client (typed or not) exposes `rpc`. */
export interface TaxonomyRpcClient {
  rpc: (
    fn: "set_games_taxonomies",
    args: { p_items: GameTaxonomiesItem[] }
  ) => PromiseLike<{ error: { message: string } | null }>;
}

/** Writes the taxonomies of many games (one RPC call). */
export async function saveGameTaxonomies(
  supabase: TaxonomyRpcClient,
  items: GameTaxonomiesItem[]
): Promise<void> {
  if (items.length === 0) return;
  const { error } = await supabase.rpc("set_games_taxonomies", { p_items: items });
  if (error) throw new Error(`Failed to save game taxonomies: ${error.message}`);
}

/**
 * FIELD_SYNC_MAP syncer: `igdbGame` comes from `getGameDetails`. Typed
 * clients do not know the RPC yet (types not regenerated), hence `unknown`.
 */
export async function syncTaxonomies(
  supabase: unknown,
  gameId: string,
  igdbGame: IGDBGame
): Promise<void> {
  await saveGameTaxonomies(supabase as TaxonomyRpcClient, [
    { game_id: gameId, taxonomies: toGameTaxonomies(igdbGame) },
  ]);
}
