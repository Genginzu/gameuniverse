/**
 * Manage the user's recent search queries in localStorage.
 *
 * - Up to 5 entries (most recent first)
 * - Deduplication is case-insensitive on the trimmed query
 * - All operations are SSR-safe (no-op when `window` is not available)
 * - Tolerates corrupted or missing values gracefully
 *
 * Storage key: `gu.search.recent.v1`.
 */

const STORAGE_KEY = "gu.search.recent.v1";
const MAX_ENTRIES = 5;

/** Returns the recent searches in most-recent-first order. */
export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

/**
 * Add a query at the top of the list. Trims, drops empty/blank, and
 * deduplicates case-insensitively before persisting. Returns the resulting
 * list (most-recent-first).
 */
export function addRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return readRecentSearches();
  if (typeof window === "undefined") return [];

  const current = readRecentSearches();
  const lower = trimmed.toLowerCase();
  const deduped = current.filter((q) => q.toLowerCase() !== lower);
  const next = [trimmed, ...deduped].slice(0, MAX_ENTRIES);
  persist(next);
  return next;
}

/** Remove a single entry (case-insensitive match). Returns the new list. */
export function removeRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return readRecentSearches();
  if (typeof window === "undefined") return [];

  const lower = trimmed.toLowerCase();
  const next = readRecentSearches().filter((q) => q.toLowerCase() !== lower);
  persist(next);
  return next;
}

/** Empties the list. */
export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore quota / private mode / disabled storage
  }
}

function persist(entries: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore quota / private mode / disabled storage
  }
}

// Exported for test introspection.
export const __TEST__ = { STORAGE_KEY, MAX_ENTRIES };
