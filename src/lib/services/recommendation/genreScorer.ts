/**
 * Genre scoring using the Jaccard coefficient.
 *
 * The Jaccard coefficient measures similarity between two sets:
 *   J(A, B) = |A ∩ B| / |A ∪ B|
 *
 * Returns 0 when both sets are empty or when they share no genres.
 */

/** Input for genre score computation */
export interface GenreScoreInput {
  sourceGenreIds: string[];
  candidateGenreIds: string[];
}

/**
 * Computes the Jaccard coefficient between two sets of genre IDs.
 *
 * @returns A number in [0, 1]. 0 means no overlap (or both empty), 1 means identical sets.
 */
export function computeGenreScore(input: GenreScoreInput): number {
  const source = new Set(input.sourceGenreIds);
  const candidate = new Set(input.candidateGenreIds);

  // Union size — if both empty, return 0 immediately
  const union = new Set([...source, ...candidate]);
  if (union.size === 0) {
    return 0;
  }

  // Intersection size
  let intersectionSize = 0;
  for (const id of source) {
    if (candidate.has(id)) {
      intersectionSize++;
    }
  }

  return intersectionSize / union.size;
}
