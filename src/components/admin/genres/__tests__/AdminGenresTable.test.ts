import { describe, it, expect } from "vitest";

/**
 * AdminGenresTable Unit Tests
 *
 * Tests the display logic that drives the AdminGenresTable component:
 * 1. Genre name resolution from translations for a given locale
 * 2. Pagination logic
 * 3. Sort toggling logic
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

interface GenreTranslation {
  language_code: string;
  name: string;
  description: string;
}

interface AdminGenre {
  id: string;
  slug: string;
  gameCount: number;
  translations: GenreTranslation[];
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Mirrors the getGenreName helper in AdminGenresTable.tsx */
function getGenreName(genre: AdminGenre, locale: string): string {
  const translation = genre.translations.find((t) => t.language_code === locale);
  if (translation?.name) return translation.name;
  return genre.translations[0]?.name ?? genre.slug;
}

/** Mirrors the sort toggle logic in AdminGenresTable.tsx */
function getNextSortOrder(
  currentSort: { field: string; order: "asc" | "desc" },
  clickedField: string
): { field: string; order: "asc" | "desc" } {
  const newOrder =
    currentSort.field === clickedField && currentSort.order === "asc" ? "desc" : "asc";
  return { field: clickedField, order: newOrder };
}

/** Mirrors the pagination display logic in AdminGenresTable.tsx */
function getPaginationState(pagination: PaginationInfo) {
  return {
    showPagination: pagination.totalPages > 1,
    canGoPrevious: pagination.hasPreviousPage,
    canGoNext: pagination.hasNextPage,
  };
}

const sampleGenre: AdminGenre = {
  id: "genre-1",
  slug: "action",
  gameCount: 42,
  translations: [
    { language_code: "fr", name: "Action", description: "Jeux d'action" },
    { language_code: "en", name: "Action", description: "Action games" },
  ],
};

const genreWithDifferentNames: AdminGenre = {
  id: "genre-2",
  slug: "tower-defense",
  gameCount: 5,
  translations: [
    { language_code: "fr", name: "Défense de tour", description: "" },
    { language_code: "en", name: "Tower Defense", description: "" },
  ],
};

const genreWithNoTranslations: AdminGenre = {
  id: "genre-3",
  slug: "puzzle",
  gameCount: 0,
  translations: [],
};

const genreWithOnlyFrench: AdminGenre = {
  id: "genre-4",
  slug: "aventure",
  gameCount: 10,
  translations: [{ language_code: "fr", name: "Aventure", description: "Jeux d'aventure" }],
};

describe("AdminGenresTable Logic", () => {
  describe("Genre Name Resolution (Req 1.1)", () => {
    it("returns the name for the matching locale", () => {
      expect(getGenreName(sampleGenre, "fr")).toBe("Action");
      expect(getGenreName(genreWithDifferentNames, "en")).toBe("Tower Defense");
      expect(getGenreName(genreWithDifferentNames, "fr")).toBe("Défense de tour");
    });

    it("falls back to first translation when locale not found", () => {
      expect(getGenreName(genreWithOnlyFrench, "en")).toBe("Aventure");
    });

    it("falls back to slug when no translations exist", () => {
      expect(getGenreName(genreWithNoTranslations, "fr")).toBe("puzzle");
    });
  });

  describe("Sort Toggle Logic (Req 1.3)", () => {
    it("toggles from asc to desc when clicking the same field", () => {
      const result = getNextSortOrder({ field: "slug", order: "asc" }, "slug");
      expect(result).toEqual({ field: "slug", order: "desc" });
    });

    it("defaults to asc when clicking a different field", () => {
      const result = getNextSortOrder({ field: "slug", order: "asc" }, "name");
      expect(result).toEqual({ field: "name", order: "asc" });
    });

    it("defaults to asc when clicking a different field that was desc", () => {
      const result = getNextSortOrder({ field: "name", order: "desc" }, "slug");
      expect(result).toEqual({ field: "slug", order: "asc" });
    });

    it("toggles from desc to asc when clicking the same field", () => {
      const result = getNextSortOrder({ field: "name", order: "desc" }, "name");
      expect(result).toEqual({ field: "name", order: "asc" });
    });
  });

  describe("Pagination Logic (Req 1.4)", () => {
    it("hides pagination when only one page", () => {
      const state = getPaginationState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 3,
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
});
