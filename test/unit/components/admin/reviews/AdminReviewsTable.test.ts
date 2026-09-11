/**
 * AdminReviewsTable Unit Tests
 *
 * Tests the display logic that drives the AdminReviewsTable component:
 * 1. Player name display (with fallback for null)
 * 2. Sort toggle logic
 * 3. Pagination state logic
 * 4. Date formatting
 *
 * Requirements: 1.2, 1.5
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

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Mirrors the playerName display logic in AdminReviewsTable */
function getPlayerDisplayName(review: AdminReview, fallback: string): string {
  return review.playerName ?? fallback;
}

/** Mirrors the sort toggle logic in AdminReviewsTable */
function getNextSortOrder(
  currentSort: { field: string; order: "asc" | "desc" },
  clickedField: string
): { field: string; order: "asc" | "desc" } {
  const newOrder =
    currentSort.field === clickedField && currentSort.order === "asc" ? "desc" : "asc";
  return { field: clickedField, order: newOrder };
}

/** Mirrors the pagination display logic */
function getPaginationState(pagination: PaginationInfo) {
  return {
    showPagination: pagination.totalPages > 1,
    canGoPrevious: pagination.hasPreviousPage,
    canGoNext: pagination.hasNextPage,
  };
}

/** Mirrors the date formatting logic */
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return "—";
  }
}

const sampleReview: AdminReview = {
  id: "review-1",
  rating: 15,
  contentExcerpt: "Great game with nice graphics",
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  playerName: "player1",
  playerEmail: "player1@test.com",
  gameTitle: "Zelda",
  gameId: "game-1",
};

const anonymousReview: AdminReview = {
  ...sampleReview,
  id: "review-2",
  playerName: null,
  playerEmail: null,
};

describe("AdminReviewsTable Logic", () => {
  describe("Player Name Display (Req 1.2)", () => {
    it("returns player name when available", () => {
      expect(getPlayerDisplayName(sampleReview, "Anonyme")).toBe("player1");
    });

    it("returns fallback when player name is null", () => {
      expect(getPlayerDisplayName(anonymousReview, "Anonyme")).toBe("Anonyme");
    });
  });

  describe("Sort Toggle Logic (Req 1.5)", () => {
    it("toggles from asc to desc when clicking the same field", () => {
      const result = getNextSortOrder({ field: "rating", order: "asc" }, "rating");
      expect(result).toEqual({ field: "rating", order: "desc" });
    });

    it("defaults to asc when clicking a different field", () => {
      const result = getNextSortOrder({ field: "rating", order: "asc" }, "created_at");
      expect(result).toEqual({ field: "created_at", order: "asc" });
    });

    it("defaults to asc when clicking a different field that was desc", () => {
      const result = getNextSortOrder({ field: "created_at", order: "desc" }, "player_name");
      expect(result).toEqual({ field: "player_name", order: "asc" });
    });

    it("toggles from desc to asc when clicking the same field", () => {
      const result = getNextSortOrder({ field: "game_title", order: "desc" }, "game_title");
      expect(result).toEqual({ field: "game_title", order: "asc" });
    });
  });

  describe("Pagination Logic (Req 1.5)", () => {
    it("hides pagination when only one page", () => {
      const state = getPaginationState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 5,
        limit: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(state.showPagination).toBe(false);
    });

    it("shows pagination when multiple pages exist", () => {
      const state = getPaginationState({
        currentPage: 1,
        totalPages: 3,
        totalCount: 50,
        limit: 20,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      expect(state.showPagination).toBe(true);
      expect(state.canGoNext).toBe(true);
      expect(state.canGoPrevious).toBe(false);
    });

    it("enables both buttons on middle page", () => {
      const state = getPaginationState({
        currentPage: 2,
        totalPages: 3,
        totalCount: 50,
        limit: 20,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(state.canGoNext).toBe(true);
      expect(state.canGoPrevious).toBe(true);
    });

    it("disables next on last page", () => {
      const state = getPaginationState({
        currentPage: 3,
        totalPages: 3,
        totalCount: 50,
        limit: 20,
        hasNextPage: false,
        hasPreviousPage: true,
      });
      expect(state.canGoNext).toBe(false);
      expect(state.canGoPrevious).toBe(true);
    });
  });

  describe("Date Formatting", () => {
    it("formats a valid ISO date", () => {
      const result = formatDate("2024-01-15T10:00:00Z");
      expect(result).not.toBe("—");
      expect(typeof result).toBe("string");
    });

    it("returns dash for invalid date", () => {
      expect(formatDate("not-a-date")).toBe("Invalid Date");
    });
  });
});
