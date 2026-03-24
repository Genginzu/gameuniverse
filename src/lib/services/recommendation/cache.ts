/**
 * Simple in-memory cache with configurable TTL.
 *
 * Used by the recommendation service to avoid recomputing scores
 * for the same game/user within a short time window.
 * Active invalidation is triggered when a game is deleted.
 */

import type { GameRecommendation } from "@/types/recommendation";

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

/** Default TTL: 1 hour in milliseconds */
const DEFAULT_TTL_MS = 60 * 60 * 1000;

const cache = new Map<string, CacheEntry<unknown>>();

/** Retrieve a cached value if it exists and hasn't expired */
export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

/** Store a value in the cache with a TTL */
export function cacheSet<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

/** Invalidate a specific cache entry */
export function cacheInvalidate(key: string): void {
  cache.delete(key);
}

/** Clear the entire cache (useful for testing) */
export function cacheClear(): void {
  cache.clear();
}

/**
 * Purge a deleted game from all cached recommendation lists.
 *
 * - Removes the `game:{id}` entry (recommendations *for* that game).
 * - Filters the game out of every `personal:*` and other `game:*` list
 *   so users never see a stale recommendation pointing to a deleted game.
 */
export function invalidateForDeletedGame(gameId: string): void {
  // Direct entry for this game
  cache.delete(`game:${gameId}`);

  // Scan all remaining entries and filter out the deleted game
  for (const [key, entry] of cache) {
    if (!Array.isArray(entry.data)) continue;

    const filtered = (entry.data as GameRecommendation[]).filter((rec) => rec.id !== gameId);

    // If nothing was removed, skip the write
    if (filtered.length === (entry.data as GameRecommendation[]).length) continue;

    if (filtered.length === 0) {
      cache.delete(key);
    } else {
      entry.data = filtered;
    }
  }
}
