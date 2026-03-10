import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { CollectionSummary } from "@/types/collection";
import type { CollectionSortOption, PlayerCollectionsStatsData } from "@/types/playerCollection";

const PAGE_SIZE = 12;

// Tables not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

/** Raw row from the collections list query */
interface CollectionRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  updated_at: string;
  cover_image_url: string | null;
  game_collection_items: Array<{
    game_id: string;
    games: { cover_image_url: string | null } | null;
  }>;
}

/**
 * Server-side service for player collections on the profile tab.
 * Queries game_collections with joins on game_collection_items for covers and counting.
 * Used by the API route /api/players/[id]/collections.
 */
export class PlayerCollectionsServerService {
  /**
   * Fetch paginated collections for a player, with visibility filtering and sorting.
   */
  static async fetchPlayerCollections(
    playerId: string,
    isOwner: boolean,
    sort: CollectionSortOption = "updated_at_desc",
    page: number = 1
  ): Promise<{ collections: CollectionSummary[]; totalCount: number }> {
    // games_count_desc requires application-level sort: fetch all, sort, paginate
    if (sort === "games_count_desc") {
      return this.fetchWithAppLevelSort(playerId, isOwner, page);
    }

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * PAGE_SIZE;

    // Count total visible collections
    const totalCount = await this.countCollections(playerId, isOwner);
    if (totalCount === 0) {
      return { collections: [], totalCount: 0 };
    }

    // Build paginated query with joins
    let query = supabase
      .from("game_collections" as UntypedFrom)
      .select(
        `id, name, slug, description, is_public, updated_at, cover_image_url,
         game_collection_items(game_id, games(cover_image_url))`
      )
      .eq("user_id", playerId);

    if (!isOwner) {
      query = query.eq("is_public", true);
    }

    query = applySortOrder(query, sort);
    query = query.range(offset, offset + PAGE_SIZE - 1);

    const { data, error } = await query;

    if (error) {
      if (error.code === "PGRST205") {
        return { collections: [], totalCount: 0 };
      }
      logger.error("Failed to fetch player collections", {
        error: error.message,
        playerId,
      });
      throw new Error(error.message ?? "Failed to fetch player collections");
    }

    const rows = (data ?? []) as unknown as CollectionRow[];
    return { collections: rows.map(transformCollectionRow), totalCount };
  }

  /**
   * Compute aggregated stats for a player's collections:
   * total collections, total games, and name of the largest collection.
   */
  static async fetchPlayerCollectionsStats(
    playerId: string,
    isOwner: boolean
  ): Promise<PlayerCollectionsStatsData> {
    const supabase = await createRouteHandlerClient();

    let query = supabase
      .from("game_collections" as UntypedFrom)
      .select(`id, name, game_collection_items(game_id)`)
      .eq("user_id", playerId);

    if (!isOwner) {
      query = query.eq("is_public", true);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "PGRST205") {
        return emptyStats();
      }
      logger.error("Failed to fetch player collections stats", {
        error: error.message,
        playerId,
      });
      throw new Error(error.message ?? "Failed to fetch player collections stats");
    }

    if (!data || data.length === 0) {
      return emptyStats();
    }

    return computeStatsFromRows(
      data as unknown as Array<{
        id: string;
        name: string;
        game_collection_items: Array<{ game_id: string }>;
      }>
    );
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Count visible collections for a player.
   */
  private static async countCollections(playerId: string, isOwner: boolean): Promise<number> {
    const supabase = await createRouteHandlerClient();

    let query = supabase
      .from("game_collections" as UntypedFrom)
      .select("id", { count: "exact", head: true })
      .eq("user_id", playerId);

    if (!isOwner) {
      query = query.eq("is_public", true);
    }

    const { count, error } = await query;

    if (error) {
      if (error.code === "PGRST205") return 0;
      logger.error("Failed to count player collections", {
        error: error.message,
        playerId,
      });
      throw new Error(error.message ?? "Failed to count player collections");
    }

    return count ?? 0;
  }

  /**
   * Fetch all visible collections, sort by games count in memory, then paginate.
   * Needed because Supabase can't ORDER BY a computed count of a relation.
   */
  private static async fetchWithAppLevelSort(
    playerId: string,
    isOwner: boolean,
    page: number
  ): Promise<{ collections: CollectionSummary[]; totalCount: number }> {
    const supabase = await createRouteHandlerClient();

    let query = supabase
      .from("game_collections" as UntypedFrom)
      .select(
        `id, name, slug, description, is_public, updated_at, cover_image_url,
         game_collection_items(game_id, games(cover_image_url))`
      )
      .eq("user_id", playerId);

    if (!isOwner) {
      query = query.eq("is_public", true);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "PGRST205") {
        return { collections: [], totalCount: 0 };
      }
      logger.error("Failed to fetch player collections for app-level sort", {
        error: error.message,
        playerId,
      });
      throw new Error(error.message ?? "Failed to fetch player collections");
    }

    const rows = (data ?? []) as unknown as CollectionRow[];
    const allCollections = rows.map(transformCollectionRow);

    // Sort by games count descending
    allCollections.sort((a, b) => b.gamesCount - a.gamesCount);

    // Apply pagination
    const offset = (page - 1) * PAGE_SIZE;
    const paginated = allCollections.slice(offset, offset + PAGE_SIZE);

    return { collections: paginated, totalCount: allCollections.length };
  }
}

// ---------------------------------------------------------------------------
// Private module-level helpers
// ---------------------------------------------------------------------------

/** Apply ORDER BY based on the sort option (SQL-level sorts only) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySortOrder(query: any, sort: CollectionSortOption) {
  switch (sort) {
    case "name_asc":
      return query.order("name", { ascending: true });
    case "name_desc":
      return query.order("name", { ascending: false });
    case "updated_at_desc":
    default:
      return query.order("updated_at", { ascending: false });
  }
}

/** Transform a raw Supabase row into a CollectionSummary */
function transformCollectionRow(row: CollectionRow): CollectionSummary {
  const items = row.game_collection_items || [];
  const coverImages = items
    .map((item) => item.games?.cover_image_url)
    .filter((url): url is string => url !== null)
    .slice(0, 4);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isPublic: row.is_public,
    gamesCount: items.length,
    updatedAt: row.updated_at,
    coverImages,
    coverImageUrl: row.cover_image_url,
  };
}

/** Return empty stats when no collections exist */
function emptyStats(): PlayerCollectionsStatsData {
  return {
    totalCollections: 0,
    totalGames: 0,
    largestCollection: null,
  };
}

/** Compute stats from raw collection rows with their items */
function computeStatsFromRows(
  rows: Array<{
    id: string;
    name: string;
    game_collection_items: Array<{ game_id: string }>;
  }>
): PlayerCollectionsStatsData {
  const totalCollections = rows.length;
  let totalGames = 0;
  let largestName: string | null = null;
  let largestCount = 0;

  for (const row of rows) {
    const count = row.game_collection_items?.length ?? 0;
    totalGames += count;
    if (count > largestCount) {
      largestCount = count;
      largestName = row.name;
    }
  }

  return {
    totalCollections,
    totalGames,
    largestCollection: largestName,
  };
}
