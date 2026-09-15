/**
 * Domain types for the backlog manager (issue #99).
 *
 * The backlog is the set of non-completed library entries a user still intends
 * to play, ordered by manual position and priority, with playtime estimates and
 * a contextual "what to play next" suggestion.
 */

/** Priority levels stored as integers in user_library.priority. */
export const BACKLOG_PRIORITIES = [0, 1, 2, 3] as const;
export type BacklogPriority = (typeof BACKLOG_PRIORITIES)[number];

/** Mood the user is in, used to bias the "play next" suggestion. */
export const BACKLOG_MOODS = ["any", "quick", "long", "chill", "intense"] as const;
export type BacklogMood = (typeof BACKLOG_MOODS)[number];

/** A single game in the user's backlog, enriched with playtime metadata. */
export interface BacklogGame {
  id: string;
  slug: string;
  title: string;
  coverImage?: string;
  backgroundColor?: string;
  genres: Array<{ id?: string; name: string }>;
  platforms: Array<{ id: string; name: string }>;
  developer: string;
  metascore?: number;
  /** Library status: owned, playing, wishlist, backlog (never completed here). */
  status: string;
  addedAt: string;
  priority: BacklogPriority;
  /** Manual drag-and-drop order; null when never ordered. */
  backlogPosition: number | null;
  /** Hours already played by the user on this entry. */
  playTimeHours: number;
  /**
   * Estimated hours to finish, derived from IGDB playtime fields.
   * Null when the game has no playtime data.
   */
  estimatedHours: number | null;
  /**
   * Estimated hours left to finish = estimatedHours minus the total time the
   * player has already logged on this game (aggregated from game_sessions),
   * clamped at 0. Null when there is no playtime estimate.
   */
  remainingHours: number | null;
}

/** Context supplied by the user to tune the suggestion. */
export interface BacklogSuggestionContext {
  /** Free hours the user has available right now. */
  availableHours?: number;
  /** Genre ids the user feels like playing. */
  preferredGenreIds?: string[];
  /** Desired mood / pacing. */
  mood?: BacklogMood;
}

/** A ranked suggestion produced by the suggestion engine. */
export interface BacklogSuggestion {
  game: BacklogGame;
  /** Normalized score in [0, 1]. */
  score: number;
  /** Machine-readable reasons contributing to the score. */
  reasons: BacklogSuggestionReason[];
}

export type BacklogSuggestionReason =
  | "high-priority"
  | "fits-available-time"
  | "matches-genre"
  | "quick-to-finish"
  | "long-adventure"
  | "already-started"
  | "highly-rated";

/** Filters applied to the backlog list in the UI. */
export interface BacklogFilters {
  genreIds: string[];
  /** Only games whose estimated length is <= this many hours (null = no cap). */
  maxHours: number | null;
  /** Only games whose estimated length is >= this many hours (null = no floor). */
  minHours: number | null;
  platformIds: string[];
}

/** Aggregate time metrics across the (filtered) backlog. */
export interface BacklogTimeSummary {
  gameCount: number;
  /** Total estimated hours to finish everything (games with data only). */
  totalEstimatedHours: number;
  /** Number of games lacking playtime data (excluded from the total). */
  gamesWithoutEstimate: number;
}

/** Shape returned by GET /api/library/backlog. */
export interface BacklogResponse {
  games: BacklogGame[];
}
