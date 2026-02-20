/**
 * Score combiner — weighted sum of genre, collaborative, and review scores.
 *
 * Combines the three individual scores into a single Combined_Score
 * using configurable weights. The result is normalized by the sum of
 * weights so that the output stays in [0, 1] when all input scores
 * are in [0, 1].
 *
 * Formula: (w1 * genreScore + w2 * collaborativeScore + w3 * reviewScore) / (w1 + w2 + w3)
 */

import type { CandidateScores, ScoringWeights } from "@/types/recommendation";

/** Default scoring weights (Requirement 4.1) */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  genre: 0.4,
  collaborative: 0.4,
  review: 0.2,
};

/**
 * Computes the combined recommendation score as a normalized weighted sum.
 *
 * @returns A number in [0, 1] when all input scores are in [0, 1] and weights are positive.
 */
export function computeCombinedScore(
  scores: CandidateScores,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  const totalWeight = weights.genre + weights.collaborative + weights.review;

  // Avoid division by zero — if all weights are zero, no signal exists
  if (totalWeight === 0) {
    return 0;
  }

  const weightedSum =
    weights.genre * scores.genreScore +
    weights.collaborative * scores.collaborativeScore +
    weights.review * scores.reviewScore;

  return weightedSum / totalWeight;
}
