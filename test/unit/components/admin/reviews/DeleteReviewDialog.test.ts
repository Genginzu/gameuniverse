/**
 * DeleteReviewDialog Unit Tests
 *
 * Tests the display logic that drives the DeleteReviewDialog component:
 * 1. Player name and game title display from review
 * 2. Dialog close prevention while deleting
 *
 * Requirements: 3.1
 */

import { describe, it, expect } from "bun:test";

interface AdminReview {
  id: string;
  rating: number;
  contentExcerpt: string;
  createdAt: string;
  updatedAt: string;
  playerName: string | null;
  playerEmail: string | null;
  gameTitle: string;
  gameId: string;
}

/** Mirrors the player name extraction in DeleteReviewDialog */
function getDialogPlayerName(review: AdminReview | null): string {
  return review?.playerName ?? "";
}

/** Mirrors the game title extraction in DeleteReviewDialog */
function getDialogGameTitle(review: AdminReview | null): string {
  return review?.gameTitle ?? "";
}

/** Mirrors the dialog close guard: onOpenChange fires with open=false */
function canCloseDialog(isDeleting: boolean): boolean {
  return !isDeleting;
}

const sampleReview: AdminReview = {
  id: "review-1",
  rating: 15,
  contentExcerpt: "Great game",
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  playerName: "player1",
  playerEmail: "player1@test.com",
  gameTitle: "Zelda",
  gameId: "game-1",
};

const anonymousReview: AdminReview = {
  ...sampleReview,
  playerName: null,
};

describe("DeleteReviewDialog Logic", () => {
  describe("Review Info Display (Req 3.1)", () => {
    it("returns player name from review", () => {
      expect(getDialogPlayerName(sampleReview)).toBe("player1");
    });

    it("returns empty string when player name is null", () => {
      expect(getDialogPlayerName(anonymousReview)).toBe("");
    });

    it("returns empty string when review is null", () => {
      expect(getDialogPlayerName(null)).toBe("");
    });

    it("returns game title from review", () => {
      expect(getDialogGameTitle(sampleReview)).toBe("Zelda");
    });

    it("returns empty string when review is null", () => {
      expect(getDialogGameTitle(null)).toBe("");
    });
  });

  describe("Dialog Close Guard (Req 3.1)", () => {
    it("allows close when not deleting", () => {
      expect(canCloseDialog(false)).toBe(true);
    });

    it("prevents close while deleting", () => {
      expect(canCloseDialog(true)).toBe(false);
    });
  });
});
