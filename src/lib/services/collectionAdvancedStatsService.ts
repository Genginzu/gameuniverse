import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { CollectionAdvancedStats } from "@/types/playerCollection";
import {
  computeCollectionAdvancedStats,
  emptyCollectionAdvancedStats,
  type CollectionGameData,
  type OwnerLibraryEntry,
} from "./collectionAdvancedStats";

// game_collections tables are not yet in generated Supabase types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

interface TranslationRow {
  name: string;
  language_code: string | null;
}

interface GameStatsRow {
  id: string;
  metascore: number | null;
  game_genres: Array<{ genres: { genre_translations: TranslationRow[] } | null }> | null;
  game_platforms: Array<{ platforms: { platform_translations: TranslationRow[] } | null }> | null;
}

interface LibraryStatsRow {
  game_id: string;
  status: string | null;
  play_time_hours: number | null;
}

/** Resolve a translated name for the given locale, falling back to the first available. */
function resolveName(translations: TranslationRow[] | undefined, locale: string): string | null {
  if (!translations || translations.length === 0) return null;
  const match = translations.find((t) => t.language_code === locale && t.name);
  return (match ?? translations.find((t) => t.name))?.name ?? null;
}

/** Transform a raw game row into the pure-function input shape. */
function toGameData(row: GameStatsRow, locale: string): CollectionGameData {
  const genres: string[] = [];
  for (const gg of row.game_genres ?? []) {
    const name = resolveName(gg.genres?.genre_translations, locale);
    if (name) genres.push(name);
  }

  const platforms: string[] = [];
  for (const gp of row.game_platforms ?? []) {
    const name = resolveName(gp.platforms?.platform_translations, locale);
    if (name) platforms.push(name);
  }

  return { metascore: row.metascore, genres, platforms };
}

/**
 * Server-side service computing advanced statistics for collections.
 * Used by the collection detail route and the aggregated collections-tab route.
 */
export class CollectionAdvancedStatsService {
  /**
   * Compute advanced stats for an explicit set of games, using the owner's
   * library for completion/playtime metrics.
   */
  static async computeForGames(
    gameIds: string[],
    ownerId: string,
    locale: string
  ): Promise<CollectionAdvancedStats> {
    const uniqueIds = Array.from(new Set(gameIds));
    if (uniqueIds.length === 0) return emptyCollectionAdvancedStats();

    const [games, library] = await Promise.all([
      this.fetchGames(uniqueIds, locale),
      this.fetchOwnerLibrary(uniqueIds, ownerId),
    ]);

    return computeCollectionAdvancedStats(games, library);
  }

  /**
   * Compute aggregated advanced stats across all of a player's visible
   * collections (all collections for the owner, public only otherwise).
   */
  static async fetchPlayerAdvancedStats(
    playerId: string,
    isOwner: boolean,
    locale: string
  ): Promise<CollectionAdvancedStats> {
    const supabase = await createRouteHandlerClient();

    let query = supabase
      .from("game_collections" as UntypedFrom)
      .select("is_public, game_collection_items(game_id)")
      .eq("user_id", playerId);

    if (!isOwner) {
      query = query.eq("is_public", true);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "PGRST205") return emptyCollectionAdvancedStats();
      logger.error("Failed to fetch collections for advanced stats", {
        error: error.message,
        playerId,
      });
      throw new Error(error.message ?? "Failed to fetch collections for advanced stats");
    }

    const rows = (data ?? []) as unknown as Array<{
      game_collection_items: Array<{ game_id: string }> | null;
    }>;

    const gameIds = rows.flatMap((r) => (r.game_collection_items ?? []).map((i) => i.game_id));

    return this.computeForGames(gameIds, playerId, locale);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private static async fetchGames(
    gameIds: string[],
    locale: string
  ): Promise<CollectionGameData[]> {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("games")
      .select(
        `id, metascore,
         game_genres(genres(genre_translations(name, language_code))),
         game_platforms(platforms(platform_translations(name, language_code)))`
      )
      .in("id", gameIds);

    if (error) {
      logger.error("Failed to fetch games for collection stats", { error: error.message });
      throw new Error(error.message ?? "Failed to fetch games for collection stats");
    }

    return ((data ?? []) as unknown as GameStatsRow[]).map((row) => toGameData(row, locale));
  }

  private static async fetchOwnerLibrary(
    gameIds: string[],
    ownerId: string
  ): Promise<OwnerLibraryEntry[]> {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("user_library")
      .select("game_id, status, play_time_hours")
      .eq("user_id", ownerId)
      .in("game_id", gameIds);

    if (error) {
      logger.error("Failed to fetch owner library for collection stats", { error: error.message });
      throw new Error(error.message ?? "Failed to fetch owner library for collection stats");
    }

    return ((data ?? []) as LibraryStatsRow[]).map((row) => ({
      status: row.status,
      playTimeHours: row.play_time_hours ?? 0,
    }));
  }
}
