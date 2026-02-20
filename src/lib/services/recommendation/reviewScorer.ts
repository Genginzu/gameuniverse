/**
 * Review scoring with confidence discount.
 *
 * Normalizes the average rating (0-20 scale) to [0, 1] and applies
 * a confidence discount when the review count is below a threshold.
 *
 * - No reviews → neutral score (0.5)
 * - Few reviews → score pulled toward neutral proportionally
 * - Enough reviews → full normalized rating
 */

/** Input for review score computation */
export interface ReviewScoreInput {
  /** Average rating on a 0-20 scale, null if no reviews exist */
  averageRating: number | null;
  /** Number of reviews for the candidate game */
  reviewCount: number;
  /** Minimum reviews needed for full confidence (default: 3) */
  minReviewsForFullConfidence: number;
}

/** Neutral score used when there are no reviews (Requirement 3.2) */
const NEUTRAL_SCORE = 0.5;

/** Maximum value on the rating scale */
const MAX_RATING = 20;

/**
 * Computes the review score normalized to [0, 1] with confidence discount.
 *
 * When averageRating is null (no reviews), returns 0.5 (neutral).
 * When reviewCount < minReviewsForFullConfidence, the score is pulled
 * toward neutral proportionally: discount = reviewCount / minReviewsForFullConfidence.
 *
 * Formula: NEUTRAL + (normalizedRating - NEUTRAL) * discount
 *
 * @returns A number in [0, 1].
 */
export function computeReviewScore(input: ReviewScoreInput): number {
  // No reviews → neutral score (Requirement 3.2)
  if (input.averageRating === null || input.reviewCount <= 0) {
    return NEUTRAL_SCORE;
  }

  // Normalize rating from 0-20 to 0-1
  const normalizedRating = Math.max(0, Math.min(input.averageRating, MAX_RATING)) / MAX_RATING;

  // Confidence discount (Requirement 3.3)
  const confidence =
    input.reviewCount >= input.minReviewsForFullConfidence
      ? 1
      : input.reviewCount / input.minReviewsForFullConfidence;

  // Pull toward neutral based on confidence
  return NEUTRAL_SCORE + (normalizedRating - NEUTRAL_SCORE) * confidence;
}
