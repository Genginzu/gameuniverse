import { keyEquals, keyStartsWith, type KeyFilter } from "./optimistic";

// Library -----------------------------------------------------------------

export const LIBRARY_LIST_KEY = "/api/library";
export const LIBRARY_STATS_KEY = "/api/library/stats";
export const BACKLOG_KEY = "/api/library/backlog";

export function libraryStatusKey(gameId: string): string {
  return `/api/library/${gameId}`;
}

/** Keys made stale when a game enters or leaves the library. */
export const LIBRARY_RELATED_KEYS: KeyFilter[] = [
  keyEquals(LIBRARY_LIST_KEY),
  keyStartsWith(`${LIBRARY_LIST_KEY}?`),
  keyEquals(LIBRARY_STATS_KEY),
  keyEquals(BACKLOG_KEY),
  (key) => typeof key === "string" && key.startsWith("/api/games?") && key.includes("inLibrary=true"),
];

// Character favorites -----------------------------------------------------

export function favoriteStatusKey(slug: string): string {
  return `/api/characters/${slug}/favorite`;
}

export function favoriteCountKey(slug: string): string {
  return `/api/characters/${slug}/favorite/count`;
}

/** Keys made stale when a character is favorited or unfavorited. */
export const FAVORITE_RELATED_KEYS: KeyFilter[] = [keyStartsWith("/api/favorites/characters?")];

// Collections -------------------------------------------------------------

function collectionsBase(playerId: string): string {
  return `/api/players/${playerId}/collections`;
}

export function collectionsListKey(playerId: string, locale: string): string {
  return `${collectionsBase(playerId)}?locale=${locale}`;
}

export function collectionDetailKey(playerId: string, slug: string, locale: string): string {
  return `${collectionsBase(playerId)}/${slug}?locale=${locale}`;
}

export function collectionStatsKey(playerId: string, locale: string): string {
  return `${collectionsBase(playerId)}/stats?locale=${locale}`;
}

/** List and stats of a player's collections, in every locale. */
export function collectionsOverviewKeys(playerId: string): KeyFilter[] {
  return [
    keyStartsWith(`${collectionsBase(playerId)}?`),
    keyStartsWith(`${collectionsBase(playerId)}/stats?`),
  ];
}

/** Overview plus the detail of one collection, in every locale. */
export function collectionKeys(playerId: string, slug: string): KeyFilter[] {
  return [
    ...collectionsOverviewKeys(playerId),
    keyStartsWith(`${collectionsBase(playerId)}/${slug}?`),
  ];
}
