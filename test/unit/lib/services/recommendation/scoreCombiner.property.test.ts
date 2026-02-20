import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computeCombinedScore } from "@/lib/services/recommendation/scoreCombiner";
import type { CandidateScores, ScoringWeights } from "@/types/recommendation";

/**
 * Feature: game-recommendations, Property 5: Combined score is a weighted sum
 *
 * _For any_ four scores (genre, collaborative, review, metacritic) in [0, 1]
 * and any positive weights, the Combined_Score should equal the normalized
 * weighted sum of active signals. When metacriticScore is null, its weight
 * is excluded from the denominator.
 *
 * **Validates: Requirements 4.1, 3.1**
 */

// --- Generators ---

/** Score in [0, 1] — excludes NaN/Infinity */
const scoreGen = fc.double({ min: 0, max: 1, noNaN: true });

/** Optional score: either a number in [0,1] or null */
const optionalScoreGen = fc.oneof(scoreGen, fc.constant(null));

/** Positive weight (strictly > 0) — excludes NaN/Infinity */
const positiveWeightGen = fc.double({
  min: Number.EPSILON,
  max: 100,
  noNaN: true,
});

/** CandidateScores with metacriticScore that can be null */
const candidateScoresGen: fc.Arbitrary<CandidateScores> = fc.record({
  genreScore: scoreGen,
  collaborativeScore: scoreGen,
  reviewScore: scoreGen,
  metacriticScore: optionalScoreGen,
});

/** CandidateScores with all scores present (non-null) */
const fullCandidateScoresGen: fc.Arbitrary<CandidateScores> = fc.record({
  genreScore: scoreGen,
  collaborativeScore: scoreGen,
  reviewScore: scoreGen,
  metacriticScore: scoreGen,
});

/** ScoringWeights with all positive weights */
const positiveWeightsGen: fc.Arbitrary<ScoringWeights> = fc.record({
  genre: positiveWeightGen,
  collaborative: positiveWeightGen,
  review: positiveWeightGen,
  metacritic: positiveWeightGen,
});

// --- Helpers ---

/** Reference weighted-sum implementation with optional metacritic */
function referenceWeightedSum(scores: CandidateScores, weights: ScoringWeights): number {
  let totalWeight = weights.genre + weights.collaborative + weights.review;
  let weightedSum =
    weights.genre * scores.genreScore +
    weights.collaborative * scores.collaborativeScore +
    weights.review * scores.reviewScore;

  if (scores.metacriticScore !== null) {
    totalWeight += weights.metacritic;
    weightedSum += weights.metacritic * scores.metacriticScore;
  }

  if (totalWeight === 0) return 0;
  return weightedSum / totalWeight;
}

// --- Tests ---

describe("scoreCombiner - Property-Based Tests", () => {
  describe("Property 5: Combined score is a weighted sum", () => {
    it("equals the reference weighted sum for any scores and positive weights", () => {
      fc.assert(
        fc.property(candidateScoresGen, positiveWeightsGen, (scores, weights) => {
          const result = computeCombinedScore(scores, weights);
          const expected = referenceWeightedSum(scores, weights);
          expect(result).toBeCloseTo(expected, 10);
        }),
        { numRuns: 200 }
      );
    });

    it("produces a result in [0, 1] when all scores are in [0, 1] and weights are positive", () => {
      fc.assert(
        fc.property(candidateScoresGen, positiveWeightsGen, (scores, weights) => {
          const result = computeCombinedScore(scores, weights);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(1);
        }),
        { numRuns: 200 }
      );
    });

    it("returns 0 when all weights are zero", () => {
      const zeroWeights: ScoringWeights = {
        genre: 0,
        collaborative: 0,
        review: 0,
        metacritic: 0,
      };
      fc.assert(
        fc.property(candidateScoresGen, (scores) => {
          const result = computeCombinedScore(scores, zeroWeights);
          expect(result).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("returns the single non-zero-weighted score when only one weight is positive", () => {
      fc.assert(
        fc.property(fullCandidateScoresGen, positiveWeightGen, (scores, w) => {
          const genreOnly: ScoringWeights = {
            genre: w,
            collaborative: 0,
            review: 0,
            metacritic: 0,
          };
          expect(computeCombinedScore(scores, genreOnly)).toBeCloseTo(scores.genreScore, 10);

          const collabOnly: ScoringWeights = {
            genre: 0,
            collaborative: w,
            review: 0,
            metacritic: 0,
          };
          expect(computeCombinedScore(scores, collabOnly)).toBeCloseTo(
            scores.collaborativeScore,
            10
          );

          const reviewOnly: ScoringWeights = {
            genre: 0,
            collaborative: 0,
            review: w,
            metacritic: 0,
          };
          expect(computeCombinedScore(scores, reviewOnly)).toBeCloseTo(scores.reviewScore, 10);

          const metacriticOnly: ScoringWeights = {
            genre: 0,
            collaborative: 0,
            review: 0,
            metacritic: w,
          };
          expect(computeCombinedScore(scores, metacriticOnly)).toBeCloseTo(
            scores.metacriticScore as number,
            10
          );
        }),
        { numRuns: 100 }
      );
    });

    it("is invariant to uniform scaling of weights", () => {
      fc.assert(
        fc.property(
          candidateScoresGen,
          positiveWeightsGen,
          fc.double({ min: 0.01, max: 1000, noNaN: true }),
          (scores, weights, scaleFactor) => {
            const scaledWeights: ScoringWeights = {
              genre: weights.genre * scaleFactor,
              collaborative: weights.collaborative * scaleFactor,
              review: weights.review * scaleFactor,
              metacritic: weights.metacritic * scaleFactor,
            };
            const original = computeCombinedScore(scores, weights);
            const scaled = computeCombinedScore(scores, scaledWeights);
            expect(scaled).toBeCloseTo(original, 8);
          }
        ),
        { numRuns: 200 }
      );
    });

    it("excludes metacritic weight when metacriticScore is null", () => {
      fc.assert(
        fc.property(positiveWeightsGen, scoreGen, scoreGen, scoreGen, (weights, g, c, r) => {
          const scoresWithNull: CandidateScores = {
            genreScore: g,
            collaborativeScore: c,
            reviewScore: r,
            metacriticScore: null,
          };
          const result = computeCombinedScore(scoresWithNull, weights);
          // Should equal the 3-signal weighted sum without metacritic
          const expected3 =
            (weights.genre * g + weights.collaborative * c + weights.review * r) /
            (weights.genre + weights.collaborative + weights.review);
          expect(result).toBeCloseTo(expected3, 10);
        }),
        { numRuns: 200 }
      );
    });
  });
});
