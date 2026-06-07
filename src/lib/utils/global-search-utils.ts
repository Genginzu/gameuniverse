// Utility functions for global search hook — extracted for testability
// Requirements: 4.1, 4.2, 4.3, 5.1, 5.3, 5.4 + F0-07d (esport teams/pro players, coaches)

import type {
  GlobalSearchCharacterItem,
  GlobalSearchCoachItem,
  GlobalSearchGameItem,
  GlobalSearchPlayerItem,
  GlobalSearchProPlayerItem,
  GlobalSearchResponse,
  GlobalSearchTeamItem,
} from "@/types/global-search";

/** Union type for any search result item with a discriminant `type` field. */
export type FlatSearchItem =
  | (GlobalSearchGameItem & { type: "game" })
  | (GlobalSearchCharacterItem & { type: "character" })
  | (GlobalSearchPlayerItem & { type: "player" })
  | (GlobalSearchTeamItem & { type: "team" })
  | (GlobalSearchProPlayerItem & { type: "proPlayer" })
  | (GlobalSearchCoachItem & { type: "coach" });

/**
 * Flatten grouped results into a single ordered list, in the canonical order:
 *   games → characters → players → teams → proPlayers → coaches.
 *
 * Each item is tagged with its `type` for downstream routing. The order is
 * stable because keyboard navigation (↓/↑) and the F0-07c overlay rely on it.
 */
export function flattenResults(results: GlobalSearchResponse | null): FlatSearchItem[] {
  if (!results) return [];
  return [
    ...results.games.map((g) => ({ ...g, type: "game" as const })),
    ...results.characters.map((c) => ({ ...c, type: "character" as const })),
    ...results.players.map((p) => ({ ...p, type: "player" as const })),
    ...results.teams.map((t) => ({ ...t, type: "team" as const })),
    ...results.proPlayers.map((p) => ({ ...p, type: "proPlayer" as const })),
    ...results.coaches.map((c) => ({ ...c, type: "coach" as const })),
  ];
}

/**
 * Compute the next active index after an Arrow Down press.
 * Clamps to [−1, totalResults − 1]. Starts from −1 (no selection).
 */
export function computeNextIndex(currentIndex: number, totalResults: number): number {
  if (totalResults <= 0) return -1;
  return Math.min(currentIndex + 1, totalResults - 1);
}

/**
 * Compute the next active index after an Arrow Up press.
 * Clamps to [−1, totalResults − 1]. −1 means no selection.
 */
export function computePrevIndex(currentIndex: number): number {
  return Math.max(currentIndex - 1, -1);
}

/**
 * Generate the navigation URL for a search result item.
 * Returns paths without locale prefix — the i18n router adds it automatically.
 * Returns `null` for IGDB games (they need import first, handled by the
 * component) and for any item missing the routing key.
 */
export function getResultUrl(item: FlatSearchItem): string | null {
  switch (item.type) {
    case "game":
      return item.source === "local" ? `/games/${item.slug}` : null;
    case "character":
      return `/characters/${item.slug}`;
    case "player":
      return `/players/${item.id}`;
    case "team":
      return `/esport/teams/${item.id}`;
    case "proPlayer":
      return `/esport/players/${item.id}`;
    case "coach":
      return `/coaching/${item.username}`;
  }
}
