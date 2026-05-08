/**
 * Tiny in-memory TTL cache, shared by the esport services.
 *
 * This is intentionally minimal: a single Map keyed by string, with
 * a fixed TTL set per call. It's adequate for serverless route handlers
 * where the lambda lifecycle naturally bounds memory usage, and where
 * the data sources are paginated DB reads that benefit from short-lived
 * caching to avoid duplicate work across SWR revalidations.
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class TtlCache {
  private store = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly defaultTtlMs: number) {}

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  clear(): void {
    this.store.clear();
  }
}
