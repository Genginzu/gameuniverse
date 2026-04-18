import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

/**
 * Real-time update types
 */
export type UpdateType = "game_created" | "game_updated" | "game_deleted" | "bulk_operation";

export interface GameUpdateEvent {
  type: UpdateType;
  gameId?: string;
  gameIds?: string[];
  slug?: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

/**
 * Broadcast real-time updates to connected clients
 * This uses Supabase's real-time capabilities to notify clients of changes
 */
export async function broadcastGameUpdate(event: GameUpdateEvent) {
  try {
    const supabase = await createRouteHandlerClient();

    // Send real-time update via Supabase channel
    const channel = supabase.channel("game_updates");

    await channel.send({
      type: "broadcast",
      event: "game_update",
      payload: event,
    });
  } catch (error) {
    logger.error("Error broadcasting real-time update", { error });
    // Don't throw error as this is not critical for the main operation
  }
}

/**
 * Notify clients when a game is created
 */
export async function notifyGameCreated(
  gameId: string,
  slug: string,
  data?: Record<string, unknown>
) {
  await broadcastGameUpdate({
    type: "game_created",
    gameId,
    slug,
    timestamp: new Date().toISOString(),
    data,
  });
}

/**
 * Notify clients when a game is updated
 */
export async function notifyGameUpdated(
  gameId: string,
  slug?: string,
  data?: Record<string, unknown>
) {
  await broadcastGameUpdate({
    type: "game_updated",
    gameId,
    slug,
    timestamp: new Date().toISOString(),
    data,
  });
}

/**
 * Notify clients when a game is deleted
 */
export async function notifyGameDeleted(gameId: string, slug: string) {
  await broadcastGameUpdate({
    type: "game_deleted",
    gameId,
    slug,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Notify clients when bulk operations are performed
 */
export async function notifyBulkOperation(
  operation: "delete" | "update",
  gameIds: string[],
  data?: Record<string, unknown>
) {
  await broadcastGameUpdate({
    type: "bulk_operation",
    gameIds,
    timestamp: new Date().toISOString(),
    data: {
      operation,
      count: gameIds.length,
      ...data,
    },
  });
}

/**
 * Client-side hook for listening to real-time updates
 * This would be used in React components to update the UI in real-time
 */
export function createGameUpdatesListener() {
  return {
    subscribe: (_callback: (event: GameUpdateEvent) => void) => {
      // This would be implemented on the client side using Supabase client
      // Example implementation:
      /*
      const supabase = createClient();
      const channel = supabase.channel("game_updates");
      
      channel
        .on("broadcast", { event: "game_update" }, (payload) => {
          callback(payload.payload as GameUpdateEvent);
        })
        .subscribe();
      
      return () => {
        channel.unsubscribe();
      };
      */
    },
  };
}

/**
 * Invalidate cache entries for updated games and ensure search consistency
 * This helps ensure that cached data is refreshed when games are modified
 */
export async function invalidateGameCache(gameIds: string | string[]) {
  try {
    const ids = Array.isArray(gameIds) ? gameIds : [gameIds];

    // In a production environment, you might want to:
    // 1. Clear Redis cache entries
    // 2. Invalidate CDN cache
    // 3. Update search indexes
    // 4. Refresh materialized views
    // 5. Clear application-level caches

    // Simulate comprehensive cache invalidation
    const _cacheInvalidationTasks = [
      // Clear game detail caches
      ...ids.map((id) => `game:${id}`),
      // Clear game list caches (pagination, search results, filters)
      "games:list:*",
      "games:search:*",
      "games:filter:*",
      // Clear genre-specific caches
      "genres:games:*",
      // Clear company-specific caches
      "companies:games:*",
      // Clear media caches
      ...ids.flatMap((id) => [`game:${id}:screenshots`, `game:${id}:artwork`, `game:${id}:videos`]),
      // Clear pricing caches
      ...ids.map((id) => `game:${id}:prices`),
    ];

    // For now, we'll just log the cache invalidation
    // In the future, this could integrate with Redis, CDN APIs, etc.

    // Simulate search index updates
    await updateSearchIndexes(ids);
  } catch (error) {
    logger.error("Error invalidating game cache", { error });
  }
}

/**
 * Update search indexes to ensure deleted games are removed from all search results
 */
async function updateSearchIndexes(_gameIds: string[]) {
  try {
    // In a real implementation, this would:
    // 1. Remove games from Elasticsearch/Algolia indexes
    // 2. Update full-text search indexes in PostgreSQL
    // 3. Clear any cached search results
    // 4. Rebuild genre/company aggregations

    // For now, we simulate this process
    const _indexUpdateTasks = [
      "elasticsearch:games:remove",
      "postgresql:fts:refresh",
      "aggregations:genres:rebuild",
      "aggregations:companies:rebuild",
    ];

    // Simulate async index updates
    await Promise.resolve();
  } catch (error) {
    logger.error("Error updating search indexes", { error });
  }
}

/**
 * Verify that deleted games are completely removed from all search results
 */
export async function verifyGameDeletionConsistency(
  gameIds: string[],
  supabaseClient?: ReturnType<typeof createRouteHandlerClient> extends Promise<infer T> ? T : never
): Promise<{
  isConsistent: boolean;
  inconsistencies: string[];
}> {
  try {
    const supabase = supabaseClient || (await createRouteHandlerClient());
    const inconsistencies: string[] = [];

    // Check if games still appear in any search results
    for (const gameId of gameIds) {
      // Check main games table
      const { data: gameExists } = await supabase
        .from("games")
        .select("id")
        .eq("id", gameId)
        .limit(1);

      if (gameExists && gameExists.length > 0) {
        inconsistencies.push(`Game ${gameId} still exists in games table`);
      }

      // Check related tables (should be empty due to CASCADE)
      const relatedTables = [
        "game_translations",
        "game_genres",
        "game_companies",
        "game_screenshots",
        "game_artwork",
        "game_videos",
        "game_prices",
      ] as const;

      for (const table of relatedTables) {
        const { data: relatedData } = await supabase
          .from(table)
          .select("id")
          .eq("game_id", gameId)
          .limit(1);

        if (relatedData && relatedData.length > 0) {
          inconsistencies.push(`Game ${gameId} still has data in ${table}`);
        }
      }
    }

    return {
      isConsistent: inconsistencies.length === 0,
      inconsistencies,
    };
  } catch (error) {
    logger.error("Error verifying game deletion consistency", { error });
    return {
      isConsistent: false,
      inconsistencies: [`Error during consistency check: ${error}`],
    };
  }
}
