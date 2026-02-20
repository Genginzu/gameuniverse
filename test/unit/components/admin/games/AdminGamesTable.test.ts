import { describe, it, expect } from "vitest";
import { getPermissionsForRole, type UserRole } from "../../../../../src/hooks/useAdminAuth";

/**
 * AdminGamesTable Unit Tests
 *
 * Tests the display logic that drives the AdminGamesTable component:
 * 1. Game info display - all required fields present
 * 2. Pagination logic
 * 3. Delete button visibility based on role permissions
 *
 * Requirements: 3.2, 6.4
 */

interface AdminGame {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  releaseDate: string | null;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Simulate the date formatting logic from AdminGamesTable
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return "—";
  }
}

// Simulate the game row data extraction logic
function extractGameRowData(game: AdminGame) {
  return {
    hasImage: game.coverImage !== null,
    title: game.title,
    releaseDate: formatDate(game.releaseDate),
    updatedAt: formatDate(game.updatedAt),
  };
}

// Simulate delete button visibility logic
function canShowDeleteButton(role: UserRole): boolean {
  return getPermissionsForRole(role).canDelete;
}

// Simulate pagination state
function getPaginationState(pagination: PaginationInfo) {
  return {
    showPagination: pagination.totalPages > 1,
    canGoPrevious: pagination.hasPreviousPage,
    canGoNext: pagination.hasNextPage,
    label: `${pagination.currentPage} / ${pagination.totalPages}`,
  };
}

const sampleGame: AdminGame = {
  id: "123",
  slug: "test-game",
  title: "Test Game",
  coverImage: "https://example.com/image.jpg",
  releaseDate: "2024-06-15",
  updatedAt: "2025-01-10T12:00:00Z",
};

const sampleGameNoImage: AdminGame = {
  ...sampleGame,
  id: "456",
  coverImage: null,
  releaseDate: null,
};

describe("AdminGamesTable Logic", () => {
  describe("Game Info Display (Req 3.2)", () => {
    it("extracts all required fields from a game with full data", () => {
      const row = extractGameRowData(sampleGame);
      expect(row.hasImage).toBe(true);
      expect(row.title).toBe("Test Game");
      expect(row.releaseDate).not.toBe("—");
      expect(row.updatedAt).not.toBe("—");
    });

    it("handles missing cover image with placeholder indicator", () => {
      const row = extractGameRowData(sampleGameNoImage);
      expect(row.hasImage).toBe(false);
    });

    it("handles null release date with dash", () => {
      const row = extractGameRowData(sampleGameNoImage);
      expect(row.releaseDate).toBe("—");
    });

    it("formats valid dates", () => {
      expect(formatDate("2024-06-15")).not.toBe("—");
      expect(formatDate(null)).toBe("—");
    });
  });

  describe("Pagination Logic", () => {
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

  describe("Delete Button Visibility (Req 6.4)", () => {
    it("shows delete button for admin role", () => {
      expect(canShowDeleteButton("admin")).toBe(true);
    });

    it("hides delete button for contributor role", () => {
      expect(canShowDeleteButton("contributor")).toBe(false);
    });

    it("hides delete button for regular user role", () => {
      expect(canShowDeleteButton("user")).toBe(false);
    });
  });
});
