import { describe, it, expect } from "vitest";
import { computeCombinedScore, DEFAULT_WEIGHTS } from "@/lib/services/recommendation/scoreCombiner";
import type { CandidateScores, ScoringWeights } from "@/types/recommendation";

describe("scoreCombiner", () => {
  describe("DEFAULT_WEIGHTS", () => {
    it("should have the expected default values", () => {
      expect(DEFAULT_WEIGHTS).toEqual({
        genre: 0.35,
        collaborative: 0.35,
        review: 0.15,
        metacritic: 0.15,
      });
    });

    it("should sum to 1.0", () => {
      const sum =
        DEFAULT_WEIGHTS.genre +
        DEFAULT_WEIGHTS.collaborative +
        DEFAULT_WEIGHTS.review +
        DEFAULT_WEIGHTS.metacritic;
      expect(sum).toBeCloseTo(1.0);
    });
  });

  describe("computeCombinedScore", () => {
    it("should return 0 when all scores are 0", () => {
      const scores: CandidateScores = {
        genreScore: 0,
        collaborativeScore: 0,
        reviewScore: 0,
        metacriticScore: 0,
      };
      expect(computeCombinedScore(scores)).toBe(0);
    });

    it("should return 1 when all scores are 1", () => {
      const scores: CandidateScores = {
        genreScore: 1,
        collaborativeScore: 1,
        reviewScore: 1,
        metacriticScore: 1,
      };
      expect(computeCombinedScore(scores)).toBeCloseTo(1);
    });

    it("should compute the normalized weighted sum with default weights (all signals)", () => {
      const scores: CandidateScores = {
        genreScore: 0.8,
        collaborativeScore: 0.6,
        reviewScore: 0.5,
        metacriticScore: 0.9,
      };
      // (0.35*0.8 + 0.35*0.6 + 0.15*0.5 + 0.15*0.9) / 1.0
      // = (0.28 + 0.21 + 0.075 + 0.135) / 1.0 = 0.70
      expect(computeCombinedScore(scores)).toBeCloseTo(0.7);
    });

    it("should exclude metacritic from weighting when metacriticScore is null", () => {
      const scores: CandidateScores = {
        genreScore: 0.8,
        collaborativeScore: 0.6,
        reviewScore: 0.5,
        metacriticScore: null,
      };
      // Only genre + collaborative + review weights active: 0.35 + 0.35 + 0.15 = 0.85
      // (0.35*0.8 + 0.35*0.6 + 0.15*0.5) / 0.85
      // = (0.28 + 0.21 + 0.075) / 0.85 = 0.565 / 0.85 ≈ 0.6647
      expect(computeCombinedScore(scores)).toBeCloseTo(0.565 / 0.85);
    });

    it("should use custom weights when provided", () => {
      const scores: CandidateScores = {
        genreScore: 1,
        collaborativeScore: 0,
        reviewScore: 0,
        metacriticScore: 0,
      };
      const weights: ScoringWeights = {
        genre: 1,
        collaborative: 0,
        review: 0,
        metacritic: 0,
      };
      expect(computeCombinedScore(scores, weights)).toBeCloseTo(1);
    });

    it("should normalize by total weight when weights don't sum to 1", () => {
      const scores: CandidateScores = {
        genreScore: 1,
        collaborativeScore: 1,
        reviewScore: 1,
        metacriticScore: 1,
      };
      const weights: ScoringWeights = {
        genre: 2,
        collaborative: 2,
        review: 1,
        metacritic: 1,
      };
      // (2+2+1+1) / (2+2+1+1) = 1
      expect(computeCombinedScore(scores, weights)).toBeCloseTo(1);
    });

    it("should return 0 when all weights are 0", () => {
      const scores: CandidateScores = {
        genreScore: 0.8,
        collaborativeScore: 0.6,
        reviewScore: 0.5,
        metacriticScore: 0.7,
      };
      const weights: ScoringWeights = {
        genre: 0,
        collaborative: 0,
        review: 0,
        metacritic: 0,
      };
      expect(computeCombinedScore(scores, weights)).toBe(0);
    });

    it("should weight genre-only when other weights are 0", () => {
      const scores: CandidateScores = {
        genreScore: 0.7,
        collaborativeScore: 0.9,
        reviewScore: 0.3,
        metacriticScore: 0.8,
      };
      const weights: ScoringWeights = {
        genre: 1,
        collaborative: 0,
        review: 0,
        metacritic: 0,
      };
      expect(computeCombinedScore(scores, weights)).toBeCloseTo(0.7);
    });

    it("should weight metacritic-only when other weights are 0", () => {
      const scores: CandidateScores = {
        genreScore: 0.7,
        collaborativeScore: 0.9,
        reviewScore: 0.3,
        metacriticScore: 0.85,
      };
      const weights: ScoringWeights = {
        genre: 0,
        collaborative: 0,
        review: 0,
        metacritic: 1,
      };
      expect(computeCombinedScore(scores, weights)).toBeCloseTo(0.85);
    });

    it("should ignore metacritic weight entirely when score is null", () => {
      const scoresWithMeta: CandidateScores = {
        genreScore: 0.5,
        collaborativeScore: 0.5,
        reviewScore: 0.5,
        metacriticScore: null,
      };
      const scoresWithoutMeta: CandidateScores = {
        genreScore: 0.5,
        collaborativeScore: 0.5,
        reviewScore: 0.5,
        metacriticScore: null,
      };
      // Both should produce the same result regardless of metacritic weight
      const weights1: ScoringWeights = {
        genre: 0.4,
        collaborative: 0.4,
        review: 0.2,
        metacritic: 0.5,
      };
      const weights2: ScoringWeights = {
        genre: 0.4,
        collaborative: 0.4,
        review: 0.2,
        metacritic: 0,
      };
      expect(computeCombinedScore(scoresWithMeta, weights1)).toBeCloseTo(
        computeCombinedScore(scoresWithoutMeta, weights2)
      );
    });
  });
});
