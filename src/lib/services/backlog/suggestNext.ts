/**
 * Pure "what to play next" suggestion engine for the backlog.
 *
 * Given the user's backlog and a lightweight context (available time, preferred
 * genres, mood), we score each game in [0, 1] and rank them. The engine is
 * deterministic and side-effect free so it can be unit-tested in isolation and
 * run either on the server or the client.
 */

import type {
  BacklogGame,
  BacklogSuggestion,
  BacklogSuggestionContext,
  BacklogSuggestionReason,
} from "@/types/backlog";

/** Relative weight of each scoring factor. Sums to 1. */
export const SUGGESTION_WEIGHTS = {
  priority: 0.35,
  time: 0.25,
  genre: 0.2,
  mood: 0.1,
  started: 0.05,
  rating: 0.05,
} as const;

/** A game is considered "short" below this many hours, "long" above the other. */
const SHORT_HOURS = 12;
const LONG_HOURS = 35;

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Hours that actually matter for scheduling: time left to finish if known,
 * otherwise the full estimate. Null when the game has no playtime data.
 */
function effectiveHours(game: BacklogGame): number | null {
  return game.remainingHours ?? game.estimatedHours;
}

/** Priority (0..3) → [0, 1]. */
function priorityScore(game: BacklogGame): number {
  return clamp01(game.priority / 3);
}

/**
 * How well the estimated length fits the available time.
 * - No available time given → neutral 0.5 (time is not a concern).
 * - No estimate → slightly below neutral (unknown risk).
 * - Fits within budget → 1, tapering down as it overshoots.
 */
function timeScore(game: BacklogGame, availableHours?: number): number {
  if (availableHours === undefined || availableHours <= 0) return 0.5;
  const hours = effectiveHours(game);
  if (hours === null) return 0.4;

  if (hours <= availableHours) return 1;

  // Overshoot: linear falloff, reaching 0 at 3x the budget.
  const overshoot = (hours - availableHours) / (availableHours * 2);
  return clamp01(1 - overshoot);
}

/** Fraction of the game's genres that match the user's preferred genres. */
function genreScore(game: BacklogGame, preferredGenreIds?: string[]): number {
  if (!preferredGenreIds || preferredGenreIds.length === 0) return 0.5;

  const gameGenreIds = game.genres.map((g) => g.id).filter((id): id is string => Boolean(id));
  if (gameGenreIds.length === 0) return 0.3;

  const preferred = new Set(preferredGenreIds);
  const matches = gameGenreIds.filter((id) => preferred.has(id)).length;
  return clamp01(matches / gameGenreIds.length);
}

/** Mood preference on pacing / length. */
function moodScore(game: BacklogGame, mood?: BacklogSuggestionContext["mood"]): number {
  if (!mood || mood === "any") return 0.5;
  if (game.estimatedHours === null) return 0.4;

  switch (mood) {
    case "quick":
      // Prefer short games.
      return clamp01(1 - game.estimatedHours / (SHORT_HOURS * 2));
    case "long":
      // Prefer long games.
      return clamp01(game.estimatedHours / LONG_HOURS);
    case "chill":
    case "intense":
      // Pacing moods do not depend on length here; stay neutral.
      return 0.5;
    default:
      return 0.5;
  }
}

/** Small boost for games already in progress. */
function startedScore(game: BacklogGame): number {
  return game.status === "playing" || game.playTimeHours > 0 ? 1 : 0;
}

/** Metascore (0..100) → [0, 1]; unknown scores stay neutral. */
function ratingScore(game: BacklogGame): number {
  if (typeof game.metascore !== "number") return 0.5;
  return clamp01(game.metascore / 100);
}

function collectReasons(
  game: BacklogGame,
  context: BacklogSuggestionContext
): BacklogSuggestionReason[] {
  const reasons: BacklogSuggestionReason[] = [];

  if (game.priority >= 2) reasons.push("high-priority");

  if (
    context.availableHours !== undefined &&
    context.availableHours > 0 &&
    effectiveHours(game) !== null &&
    (effectiveHours(game) as number) <= context.availableHours
  ) {
    reasons.push("fits-available-time");
  }

  if (context.preferredGenreIds && context.preferredGenreIds.length > 0) {
    const preferred = new Set(context.preferredGenreIds);
    if (game.genres.some((g) => g.id && preferred.has(g.id))) {
      reasons.push("matches-genre");
    }
  }

  if (game.estimatedHours !== null && game.estimatedHours <= SHORT_HOURS) {
    reasons.push("quick-to-finish");
  } else if (game.estimatedHours !== null && game.estimatedHours >= LONG_HOURS) {
    reasons.push("long-adventure");
  }

  if (game.status === "playing" || game.playTimeHours > 0) {
    reasons.push("already-started");
  }

  if (typeof game.metascore === "number" && game.metascore >= 80) {
    reasons.push("highly-rated");
  }

  return reasons;
}

/** Computes the normalized suggestion score for a single game. */
export function computeSuggestionScore(
  game: BacklogGame,
  context: BacklogSuggestionContext = {}
): number {
  const score =
    SUGGESTION_WEIGHTS.priority * priorityScore(game) +
    SUGGESTION_WEIGHTS.time * timeScore(game, context.availableHours) +
    SUGGESTION_WEIGHTS.genre * genreScore(game, context.preferredGenreIds) +
    SUGGESTION_WEIGHTS.mood * moodScore(game, context.mood) +
    SUGGESTION_WEIGHTS.started * startedScore(game) +
    SUGGESTION_WEIGHTS.rating * ratingScore(game);

  return clamp01(score);
}

/**
 * Ranks the backlog and returns the top suggestions.
 *
 * Ties are broken by priority, then by fewer estimated hours (easier to start),
 * then by title for stable ordering.
 */
export function rankSuggestions(
  games: BacklogGame[],
  context: BacklogSuggestionContext = {},
  limit = 3
): BacklogSuggestion[] {
  const scored: BacklogSuggestion[] = games.map((game) => ({
    game,
    score: computeSuggestionScore(game, context),
    reasons: collectReasons(game, context),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.game.priority !== a.game.priority) return b.game.priority - a.game.priority;

    const aHours = a.game.estimatedHours ?? Number.POSITIVE_INFINITY;
    const bHours = b.game.estimatedHours ?? Number.POSITIVE_INFINITY;
    if (aHours !== bHours) return aHours - bHours;

    return a.game.title.localeCompare(b.game.title);
  });

  return scored.slice(0, Math.max(0, limit));
}

/** Convenience: the single best game to play next, or null when empty. */
export function suggestNext(
  games: BacklogGame[],
  context: BacklogSuggestionContext = {}
): BacklogSuggestion | null {
  return rankSuggestions(games, context, 1)[0] ?? null;
}
