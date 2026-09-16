/** Criteria used to generate an automatic collection suggestion. */
export type SuggestionCriterion = "genre" | "completionYear" | "duration" | "platform" | "rating";

/**
 * A single library game reduced to the fields needed by the suggestion engine.
 * Produced server-side from `user_library` joined with `games`.
 */
export interface LibrarySuggestionGame {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  /** Localized genre names for the game (may be empty). */
  genres: string[];
  /** Game critics score (0-100) or null when unknown. */
  metascore: number | null;
  /** Library status: owned / wishlist / completed / playing. */
  status: string;
  /** ISO date the game was added to the library. */
  addedAt: string;
  /** Player playtime in hours (proxy for game length) or null. */
  playTimeHours: number | null;
  /** Origin platform: steam / playstation / xbox / epic / manual / null. */
  sourcePlatform: string | null;
}

/** A game preview shown on a suggestion card (up to 4 per card). */
export interface SuggestedGamePreview {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
}

/**
 * An auto-generated collection suggestion.
 * The display name is resolved client-side from `titleKey` + `titleParams`
 * so it stays bilingual, then persisted as a plain string when accepted.
 */
export interface CollectionSuggestion {
  /** Deterministic id, e.g. "genre:action" or "completionYear:2025". */
  id: string;
  criterion: SuggestionCriterion;
  /** next-intl key under `collections.suggestions.names`. */
  titleKey: string;
  /** Params passed to the translation (genre, year, hours, platform...). */
  titleParams: Record<string, string | number>;
  /** All matching game ids, used to pre-fill the created collection. */
  gameIds: string[];
  gamesCount: number;
  /** Up to 4 cover previews for the card. */
  previewGames: SuggestedGamePreview[];
}

/** Response body of GET /api/collections/suggestions. */
export interface CollectionSuggestionsResponse {
  suggestions: CollectionSuggestion[];
}

/** Options tuning the suggestion engine thresholds. */
export interface SuggestionOptions {
  /** Minimum number of games for a suggestion to be emitted. */
  minGames?: number;
  /** Max number of genre-based suggestions. */
  maxGenreSuggestions?: number;
  /** Playtime (hours) below which a game counts as "short". */
  shortDurationHours?: number;
  /** Playtime (hours) at/above which a game counts as "long". */
  longDurationHours?: number;
  /** Metascore at/above which a game counts as "top rated". */
  topRatingThreshold?: number;
  /** Overall cap on the number of suggestions returned. */
  maxSuggestions?: number;
  /** Game ids to exclude entirely (e.g. already in a collection). */
  excludeGameIds?: string[];
}
