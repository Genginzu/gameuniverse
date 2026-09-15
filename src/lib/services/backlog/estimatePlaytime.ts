/**
 * Pure playtime estimation for backlog games.
 *
 * IGDB exposes three playthrough lengths (hastily / normally / completely).
 * We derive a single "time to finish" estimate, preferring the normal pace and
 * falling back to whatever data is available. All inputs are hours.
 */

/** Raw IGDB-style playthrough lengths, any of which may be missing. */
export interface PlaytimeInput {
  hastily?: number | null;
  normally?: number | null;
  completely?: number | null;
}

/** Rounds to one decimal to keep estimates tidy. */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function isUsable(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Estimates the hours needed to finish a game.
 *
 * Priority: normally → average(hastily, completely) → hastily → completely.
 * Returns null when no usable playtime data exists.
 */
export function estimateGameHours(playtime: PlaytimeInput | null | undefined): number | null {
  if (!playtime) return null;

  const { hastily, normally, completely } = playtime;

  if (isUsable(normally)) {
    return round1(normally);
  }

  if (isUsable(hastily) && isUsable(completely)) {
    return round1((hastily + completely) / 2);
  }

  if (isUsable(hastily)) {
    return round1(hastily);
  }

  if (isUsable(completely)) {
    return round1(completely);
  }

  return null;
}

/**
 * Estimated hours left to finish a game: the full estimate minus hours already
 * played, clamped at 0. Returns null when there is no estimate.
 */
export function computeRemainingHours(
  estimatedHours: number | null,
  playedHours: number
): number | null {
  if (estimatedHours === null) return null;
  const remaining = estimatedHours - (playedHours > 0 ? playedHours : 0);
  return round1(remaining > 0 ? remaining : 0);
}
