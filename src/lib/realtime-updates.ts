import { createRouteHandlerClient } from "@/lib/supabase-server";

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
  data?: Record<string, any>;
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

    console.log("Real-time update broadcasted:", event);
  } catch (error) {
    console.error("Error broadcasting real-time update:", error);
    // Don't throw error as this is not critical for the main operation
  }
}

/**
 * Notify clients when a game is created
 */
export async function notifyGameCreated(gameId: string, slug: string, data?: Record<string, any>) {
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
export async function notifyGameUpdated(gameId: string, slug?: string, data?: Record<string, any>) {
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
  data?: Record<string, any>
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
    subscribe: (callback: (event: GameUpdateEvent) => void) => {
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
 * Invalidate cache entries for updated games
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

    console.log("Cache invalidation requested for games:", ids);

    // For now, we'll just log the cache invalidation
    // In the future, this could integrate with Redis, CDN APIs, etc.
  } catch (error) {
    console.error("Error invalidating game cache:", error);
  }
}
