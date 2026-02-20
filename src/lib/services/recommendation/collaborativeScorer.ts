/**
 * Collaborative scoring based on normalized co-occurrence.
 *
 * The collaborative score measures how often two games appear together
 * in player libraries (with status "owned", "completed", or "playing").
 *
 * Score = coOccurrenceCount / sourceGameLibraryCount
 *
 * Returns 0 when fewer than 2 libraries contain the source game,
 * as there is insufficient data for meaningful collaborative filtering.
 */

/** Input for collaborative score computation */
export interface CollaborativeScoreInput {
  sourceGameId: string;
  candidateGameId: string;
  coOccurrenceCount: number;
  sourceGameLibraryCount: number;
}

/** Minimum number of libraries containing the source game for collaborative scoring */
const MIN_LIBRARY_COUNT = 2;

/**
 * Computes the collaborative score based on normalized co-occurrence.
 *
 * @returns A number in [0, 1]. 0 means no co-occurrence or insufficient data.
 */
export function computeCollaborativeScore(input: CollaborativeScoreInput): number {
  // When fewer than 2 libraries contain the source game, return 0 (Requirement 2.2)
  if (input.sourceGameLibraryCount < MIN_LIBRARY_COUNT) {
    return 0;
  }

  // Co-occurrence cannot be negative
  if (input.coOccurrenceCount <= 0) {
    return 0;
  }

  // Normalized co-occurrence: how many libraries with the source game also have the candidate
  return input.coOccurrenceCount / input.sourceGameLibraryCount;
}
