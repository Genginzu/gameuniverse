/**
 * Metacritic scoring — normalizes the metascore (0-100) to [0, 1].
 *
 * When the metascore is null (not available), returns null so the
 * score combiner can exclude this signal from the weighted sum.
 */

/** Input for metacritic score computation */
export interface MetacriticScoreInput {
  /** Metascore on a 0-100 scale, null if unavailable */
  metascore: number | null;
}

/** Maximum value on the metascore scale */
const MAX_METASCORE = 100;

/**
 * Normalizes the metascore to [0, 1].
 *
 * @returns A number in [0, 1], or null when the metascore is unavailable.
 */
export function computeMetacriticScore(input: MetacriticScoreInput): number | null {
  if (input.metascore === null || input.metascore === undefined) {
    return null;
  }

  return Math.max(0, Math.min(input.metascore, MAX_METASCORE)) / MAX_METASCORE;
}
