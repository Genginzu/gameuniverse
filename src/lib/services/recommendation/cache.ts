/**
 * Simple in-memory cache with configurable TTL.
 *
 * Used by the recommendation service to avoid recomputing scores
 * for the same game/user within a short time window.
 * TTL-based invalidation is sufficient for V1 — no active invalidation needed.
 */

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
