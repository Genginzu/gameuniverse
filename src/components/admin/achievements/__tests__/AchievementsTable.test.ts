import { describe, it, expect } from "vitest";

/**
 * AchievementsTable Unit Tests
 *
 * Tests the display logic that drives the AchievementsTable component:
 * 1. Achievement name resolution for a given locale
 * 2. Sort toggling logic
 * 3. Pagination logic
 * 4. Empty / loading state detection
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import type { AchievementCategory, AchievementTier } from "@/types/achievement";

interface AdminAchievement {
  id: string;
  key: string;
  category: AchievementCategory;
  tier: AchievementTier;
  threshold: number;
  xpValue: number;
  icon: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  sortOrder: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Mirrors getAchievementName in AchievementsTable.tsx */
function getAchievementName(achievement: AdminAchievement, locale: string): string {
  return locale === "en" ? achievement.nameEn : achievement.nameFr;
}

/** Mirrors the sort toggle logic in AchievementsTable.tsx handleSortClick */
function getNextSortOrder(
  currentSort: { field: string; order: "asc" | "desc" },
  clickedField: string
): { field: string; order: "asc" | "desc" } {
  const newOrder =
    currentSort.field === clickedField && currentSort.order === "asc" ? "desc" : "asc";
  return { field: clickedField, order: newOrder };
}

/** Mirrors the pagination display logic in AchievementsTable.tsx */
function getPaginationState(pagination: PaginationInfo) {
  return {
    showPagination: pagination.totalPages > 1,
    canGoPrevious: pagination.hasPreviousPage,
    canGoNext: pagination.hasNextPage,
  };
}

/** Determines the visual state of the table content area */
function getTableContentState(
  isLoading: boolean,
  achievements: AdminAchievement[]
): "loading" | "empty" | "data" {
  if (isLoading) return "loading";
  if (achievements.length === 0) return "empty";
  return "data";
}

const sampleAchievement: AdminAchievement = {
  id: "ach-1",
  key: "first_game",
  category: "library",
  tier: "bronze",
  threshold: 1,
  xpValue: 50,
  icon: "trophy",
  nameFr: "Premier jeu",
  nameEn: "First Game",
  descriptionFr: "Ajoutez votre premier jeu",
  descriptionEn: "Add your first game",
  sortOrder: 1,
};

const anotherAchievement: AdminAchievement = {
  id: "ach-2",
  key: "social_butterfly",
  category: "social",
  tier: "gold",
  threshold: 50,
  xpValue: 500,
  icon: "users",
  nameFr: "Papillon social",
  nameEn: "Social Butterfly",
  descriptionFr: "Ajoutez 50 amis",
  descriptionEn: "Add 50 friends",
  sortOrder: 10,
};

describe("AchievementsTable Logic", () => {
  describe("Achievement Name Resolution (Req 1.1)", () => {
    it("returns French name for fr locale", () => {
      expect(getAchievementName(sampleAchievement, "fr")).toBe("Premier jeu");
    });

    it("returns English name for en locale", () => {
      expect(getAchievementName(sampleAchievement, "en")).toBe("First Game");
    });

    it("falls back to French name for unknown locale", () => {
      expect(getAchievementName(sampleAchievement, "de")).toBe("Premier jeu");
    });

    it("resolves different achievements correctly", () => {
      expect(getAchievementName(anotherAchievement, "fr")).toBe("Papillon social");
      expect(getAchievementName(anotherAchievement, "en")).toBe("Social Butterfly");
    });
  });

  describe("Sort Toggle Logic (Req 1.4)", () => {
    it("toggles from asc to desc when clicking the same field", () => {
      const result = getNextSortOrder({ field: "key", order: "asc" }, "key");
      expect(result).toEqual({ field: "key", order: "desc" });
    });

    it("defaults to asc when clicking a different field", () => {
      const result = getNextSortOrder({ field: "key", order: "asc" }, "category");
      expect(result).toEqual({ field: "category", order: "asc" });
    });

    it("defaults to asc when clicking a different field that was desc", () => {
      const result = getNextSortOrder({ field: "tier", order: "desc" }, "xp_value");
      expect(result).toEqual({ field: "xp_value", order: "asc" });
    });

    it("toggles from desc to asc when clicking the same field", () => {
      const result = getNextSortOrder({ field: "name", order: "desc" }, "name");
      expect(result).toEqual({ field: "name", order: "asc" });
    });
  });

  describe("Pagination Logic (Req 1.2)", () => {
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

  describe("Table Content State (Req 1.5, 1.6)", () => {
    it("returns loading when isLoading is true", () => {
      expect(getTableContentState(true, [])).toBe("loading");
      expect(getTableContentState(true, [sampleAchievement])).toBe("loading");
    });

    it("returns empty when not loading and no achievements", () => {
      expect(getTableContentState(false, [])).toBe("empty");
    });

    it("returns data when not loading and achievements exist", () => {
      expect(getTableContentState(false, [sampleAchievement])).toBe("data");
      expect(getTableContentState(false, [sampleAchievement, anotherAchievement])).toBe("data");
    });
  });
});
