/**
 * AdminReviewForm Unit Tests
 *
 * Tests the validation logic used by the AdminReviewForm component:
 * 1. reviewSchema validation for form data
 * 2. Default values mapping from AdminReviewDetail
 *
 * Requirements: 2.1, 2.4
 */

import { describe, it, expect } from "bun:test";
import { reviewSchema } from "../../../../../src/lib/validations/review";

interface AdminReviewDetail {
  id: string;
  userId: string;
  gameId: string;
  rating: number;
  content: string;
  positivePoints: string[];
  negativePoints: string[];
  createdAt: string;
  updatedAt: string;
  playerName: string | null;
  gameTitle: string;
}

/** Mirrors the defaultValues mapping in AdminReviewForm */
function buildFormDefaults(review: AdminReviewDetail) {
  return {
    rating: review.rating,
    content: review.content,
    positivePoints: review.positivePoints,
    negativePoints: review.negativePoints,
  };
}

const sampleReviewDetail: AdminReviewDetail = {
  id: "review-1",
  userId: "user-1",
  gameId: "game-1",
  rating: 15,
  content: "<p>Great game</p>",
  positivePoints: ["Good story", "Nice graphics"],
  negativePoints: ["Too short"],
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  playerName: "player1",
  gameTitle: "Zelda",
};

describe("AdminReviewForm Logic", () => {
  describe("Form Default Values (Req 2.1)", () => {
    it("maps review detail to form defaults correctly", () => {
      const defaults = buildFormDefaults(sampleReviewDetail);
      expect(defaults.rating).toBe(15);
      expect(defaults.content).toBe("<p>Great game</p>");
      expect(defaults.positivePoints).toEqual(["Good story", "Nice graphics"]);
      expect(defaults.negativePoints).toEqual(["Too short"]);
    });

    it("handles empty points arrays", () => {
      const review = { ...sampleReviewDetail, positivePoints: [], negativePoints: [] };
      const defaults = buildFormDefaults(review);
      expect(defaults.positivePoints).toEqual([]);
      expect(defaults.negativePoints).toEqual([]);
    });
  });

  describe("Review Schema Validation (Req 2.4)", () => {
    it("accepts valid review data", () => {
      const result = reviewSchema.safeParse({
        rating: 15,
        content: "<p>Great game</p>",
        positivePoints: ["Good story"],
        negativePoints: ["Too short"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects rating above 20", () => {
      const result = reviewSchema.safeParse({
        rating: 21,
        content: "<p>Content</p>",
        positivePoints: [],
        negativePoints: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects rating below 0", () => {
      const result = reviewSchema.safeParse({
        rating: -1,
        content: "<p>Content</p>",
        positivePoints: [],
        negativePoints: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty content after HTML stripping", () => {
      const result = reviewSchema.safeParse({
        rating: 10,
        content: "<p>   </p>",
        positivePoints: [],
        negativePoints: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects point exceeding 200 characters", () => {
      const result = reviewSchema.safeParse({
        rating: 10,
        content: "<p>Content</p>",
        positivePoints: ["a".repeat(201)],
        negativePoints: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty point string", () => {
      const result = reviewSchema.safeParse({
        rating: 10,
        content: "<p>Content</p>",
        positivePoints: [""],
        negativePoints: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 10 positive points", () => {
      const result = reviewSchema.safeParse({
        rating: 10,
        content: "<p>Content</p>",
        positivePoints: Array.from({ length: 11 }, (_, i) => `Point ${i}`),
        negativePoints: [],
      });
      expect(result.success).toBe(false);
    });
  });
});
