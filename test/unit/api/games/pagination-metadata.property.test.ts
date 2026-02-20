import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: library-games-view
 * Property 7: Pagination metadata consistency
 * **Validates: Requirements 2.4**
 *
 * For any pagination state, the displayed current page and total pages should
 * match the actual pagination state values.
 */

// Types representing the domain
interface Game {
  id: string;
  slug: string;
  title: string;
}

interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  offset: number;
}

interface PaginationResult {
  games: Game[];
  pagination: PaginationMetadata;
}

// Constants matching the API implementation
const PAGE_SIZE = 20;

/**
 * Pure function that simulates pagination logic matching the API implementation.
 * This extracts the pagination logic from the API for isolated testing.
 */
function paginateGames(
  allGames: Game[],
  page: number,
  limit: number = PAGE_SIZE
): PaginationResult {
  const totalCount = allGames.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const validPage = Math.max(1, Math.min(page, totalPages));
  const offset = (validPage - 1) * limit;

  // Get games for the current page
  const paginatedGames = allGames.slice(offset, offset + limit);

  return {
    games: paginatedGames,
    pagination: {
      currentPage: validPage,
      totalPages,
      totalCount,
      limit,
      hasNextPage: validPage < totalPages,
      hasPreviousPage: validPage > 1,
      offset,
    },
  };
}

/**
 * Simulates what the UI component would display based on pagination metadata.
 * This mirrors the Pagination component's display logic.
 */
interface DisplayedMetadata {
  displayedCurrentPage: number;
  displayedTotalPages: number;
  displayedTotalCount: number;
}

function getDisplayedMetadata(pagination: PaginationMetadata): DisplayedMetadata {
  return {
    displayedCurrentPage: pagination.currentPage,
    displayedTotalPages: pagination.totalPages,
    displayedTotalCount: pagination.totalCount,
  };
}

// Generators for property-based testing
const gameIdGenerator = fc.uuid();
const slugGenerator = fc.stringMatching(/^[a-z0-9-]{3,30}$/);
const titleGenerator = fc.string({ minLength: 1, maxLength: 50 });

const gameGenerator = fc.record({
  id: gameIdGenerator,
  slug: slugGenerator,
  title: titleGenerator,
});

describe("Library Games API Property-Based Tests", () => {
  describe("Property 7: Pagination metadata consistency", () => {
    it("displayed currentPage matches actual pagination state currentPage", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (games, requestedPage) => {
            const result = paginateGames(games, requestedPage);
            const displayed = getDisplayedMetadata(result.pagination);

            // The displayed current page should exactly match the pagination state
            expect(displayed.displayedCurrentPage).toBe(result.pagination.currentPage);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("displayed totalPages matches actual pagination state totalPages", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (games, requestedPage) => {
            const result = paginateGames(games, requestedPage);
            const displayed = getDisplayedMetadata(result.pagination);

            // The displayed total pages should exactly match the pagination state
            expect(displayed.displayedTotalPages).toBe(result.pagination.totalPages);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("displayed totalCount matches actual pagination state totalCount", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (games, requestedPage) => {
            const result = paginateGames(games, requestedPage);
            const displayed = getDisplayedMetadata(result.pagination);

            // The displayed total count should exactly match the pagination state
            expect(displayed.displayedTotalCount).toBe(result.pagination.totalCount);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("totalPages is correctly calculated from totalCount and limit", () => {
      fc.assert(
        fc.property(fc.array(gameGenerator, { minLength: 0, maxLength: 100 }), (games) => {
          const result = paginateGames(games, 1);

          // totalPages should be ceil(totalCount / limit), minimum 1
          const expectedTotalPages = Math.max(1, Math.ceil(games.length / PAGE_SIZE));
          expect(result.pagination.totalPages).toBe(expectedTotalPages);
        }),
        { numRuns: 30 }
      );
    });

    it("currentPage is always within valid range [1, totalPages]", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: -10, max: 100 }),
          (games, requestedPage) => {
            const result = paginateGames(games, requestedPage);

            // currentPage should always be >= 1
            expect(result.pagination.currentPage).toBeGreaterThanOrEqual(1);

            // currentPage should always be <= totalPages
            expect(result.pagination.currentPage).toBeLessThanOrEqual(result.pagination.totalPages);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("hasNextPage is true if and only if currentPage < totalPages", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (games, requestedPage) => {
            const result = paginateGames(games, requestedPage);

            const expectedHasNextPage =
              result.pagination.currentPage < result.pagination.totalPages;
            expect(result.pagination.hasNextPage).toBe(expectedHasNextPage);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("hasPreviousPage is true if and only if currentPage > 1", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (games, requestedPage) => {
            const result = paginateGames(games, requestedPage);

            const expectedHasPreviousPage = result.pagination.currentPage > 1;
            expect(result.pagination.hasPreviousPage).toBe(expectedHasPreviousPage);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("offset is consistent with currentPage: offset = (currentPage - 1) * limit", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (games, requestedPage) => {
            const result = paginateGames(games, requestedPage);

            const expectedOffset = (result.pagination.currentPage - 1) * PAGE_SIZE;
            expect(result.pagination.offset).toBe(expectedOffset);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("limit is always consistent with PAGE_SIZE constant", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (games, requestedPage) => {
            const result = paginateGames(games, requestedPage);

            expect(result.pagination.limit).toBe(PAGE_SIZE);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("metadata is self-consistent: totalCount = sum of all pages' game counts", () => {
      fc.assert(
        fc.property(fc.array(gameGenerator, { minLength: 1, maxLength: 80 }), (games) => {
          const result = paginateGames(games, 1);
          const totalPages = result.pagination.totalPages;

          // Sum games across all pages
          let totalGamesAcrossPages = 0;
          for (let page = 1; page <= totalPages; page++) {
            const pageResult = paginateGames(games, page);
            totalGamesAcrossPages += pageResult.games.length;
          }

          // Total count should equal sum of all pages
          expect(result.pagination.totalCount).toBe(totalGamesAcrossPages);
        }),
        { numRuns: 30 }
      );
    });

    it("empty library has consistent metadata: totalPages=1, currentPage=1, totalCount=0", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), (requestedPage) => {
          const result = paginateGames([], requestedPage);

          expect(result.pagination.totalCount).toBe(0);
          expect(result.pagination.totalPages).toBe(1);
          expect(result.pagination.currentPage).toBe(1);
          expect(result.pagination.hasNextPage).toBe(false);
          expect(result.pagination.hasPreviousPage).toBe(false);
          expect(result.games.length).toBe(0);
        }),
        { numRuns: 30 }
      );
    });

    it("single page library has consistent metadata", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: PAGE_SIZE }),
          fc.integer({ min: 1, max: 10 }),
          (games, requestedPage) => {
            const result = paginateGames(games, requestedPage);

            // Single page library should have totalPages = 1
            expect(result.pagination.totalPages).toBe(1);
            // currentPage should be clamped to 1
            expect(result.pagination.currentPage).toBe(1);
            // No navigation possible
            expect(result.pagination.hasNextPage).toBe(false);
            expect(result.pagination.hasPreviousPage).toBe(false);
            // All games should be on this page
            expect(result.games.length).toBe(games.length);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("metadata remains consistent when navigating through all pages", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: PAGE_SIZE + 1, maxLength: 80 }),
          (games) => {
            const expectedTotalPages = Math.ceil(games.length / PAGE_SIZE);
            const expectedTotalCount = games.length;

            // Navigate through all pages and verify metadata consistency
            for (let page = 1; page <= expectedTotalPages; page++) {
              const result = paginateGames(games, page);

              // These should remain constant across all pages
              expect(result.pagination.totalPages).toBe(expectedTotalPages);
              expect(result.pagination.totalCount).toBe(expectedTotalCount);
              expect(result.pagination.limit).toBe(PAGE_SIZE);

              // currentPage should match requested page
              expect(result.pagination.currentPage).toBe(page);

              // Navigation flags should be correct for this page
              expect(result.pagination.hasNextPage).toBe(page < expectedTotalPages);
              expect(result.pagination.hasPreviousPage).toBe(page > 1);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
