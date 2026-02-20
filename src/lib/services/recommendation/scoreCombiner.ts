/**
 * Score combiner — weighted sum of genre, collaborative, review, and metacritic scores.
 *
 * Combines individual scores into a single Combined_Score using configurable
 * weights. When a signal is null (e.g. no metascore available), its weight
 * is excluded from the total so the remaining signals share the full budget.
 *
 * Formula (active signals only):
 *   sum(wi * si) / sum(wi)
 */

import type { CandidateScores, ScoringWeights } from "@/types/recommendation";

/** Default scoring weights */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  genre: 0.35,
  collaborative: 0.35,
  review: 0.15,
  metacritic: 0.15,
};

/**
 * Computes the combined recommendation score as a normalized weighted sum.
 *
 * Signals with a null value are excluded: their weight is not counted
 * in the denominator, so the remaining signals are re-normalized
 * automatically.
 *
 * @returns A number in [0, 1] when all input scores are in [0, 1] and weights are positive.
 */
export function computeCombinedScore(
  scores: CandidateScores,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  // Genre — always present (number)
  totalWeight += weights.genre;
  weightedSum += weights.genre * scores.genreScore;

  // Collaborative — always present (number)
  totalWeight += weights.collaborative;
  weightedSum += weights.collaborative * scores.collaborativeScore;

  // Review — always present (number)
  totalWeight += weights.review;
  weightedSum += weights.review * scores.reviewScore;

  // Metacritic — optional signal, excluded when null
  if (scores.metacriticScore !== null) {
    totalWeight += weights.metacritic;
    weightedSum += weights.metacritic * scores.metacriticScore;
  }

  if (totalWeight === 0) {
    return 0;
  }

  return weightedSum / totalWeight;
}
