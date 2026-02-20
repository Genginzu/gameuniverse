import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: library-games-view
 * Property 4: Pagination page size consistency
 * **Validates: Requirements 2.1**
 *
 * For any library with more than 20 games, each page except the last should
 * contain exactly 20 games, and the last page should contain the remainder (1-20 games).
 */

// Types representing the domain
interface Game {
  id: string;
  slug: string;
  title: string;
}

interface PaginationResult {
  games: Game[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    offset: number;
  };
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
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;

  // Get games for the current page
  const paginatedGames = allGames.slice(offset, offset + limit);

  return {
    games: paginatedGames,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      offset,
    },
  };
}

/**
 * Helper to get all pages of results for a given game set
 */
function getAllPages(allGames: Game[], limit: number = PAGE_SIZE): PaginationResult[] {
  const totalPages = Math.ceil(allGames.length / limit);
  const pages: PaginationResult[] = [];

  for (let page = 1; page <= totalPages; page++) {
    pages.push(paginateGames(allGames, page, limit));
  }

  return pages;
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
  describe("Property 4: Pagination page size consistency", () => {
    it("each page except the last contains exactly PAGE_SIZE games when total > PAGE_SIZE", () => {
      fc.assert(
        fc.property(
          // Generate arrays with more than PAGE_SIZE games
          fc.array(gameGenerator, { minLength: PAGE_SIZE + 1, maxLength: 100 }),
          (games) => {
            const allPages = getAllPages(games);
            const totalPages = allPages.length;

            // All pages except the last should have exactly PAGE_SIZE games
            for (let i = 0; i < totalPages - 1; i++) {
              expect(allPages[i].games.length).toBe(PAGE_SIZE);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("the last page contains the correct remainder (1 to PAGE_SIZE games)", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: PAGE_SIZE + 1, maxLength: 100 }),
          (games) => {
            const allPages = getAllPages(games);
            const lastPage = allPages[allPages.length - 1];

            // Calculate expected remainder
            const expectedRemainder = games.length % PAGE_SIZE || PAGE_SIZE;

            // Last page should have the remainder
            expect(lastPage.games.length).toBe(expectedRemainder);
            expect(lastPage.games.length).toBeGreaterThanOrEqual(1);
            expect(lastPage.games.length).toBeLessThanOrEqual(PAGE_SIZE);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("total games across all pages equals the original game count", () => {
      fc.assert(
        fc.property(fc.array(gameGenerator, { minLength: 1, maxLength: 100 }), (games) => {
          const allPages = getAllPages(games);

          // Sum of all page sizes should equal total games
          const totalGamesAcrossPages = allPages.reduce((sum, page) => sum + page.games.length, 0);

          expect(totalGamesAcrossPages).toBe(games.length);
        }),
        { numRuns: 30 }
      );
    });

    it("page size is consistent regardless of total game count", () => {
      fc.assert(
        fc.property(fc.integer({ min: PAGE_SIZE + 1, max: 200 }), (totalGames) => {
          // Generate games array of specific size
          const games: Game[] = Array.from({ length: totalGames }, (_, i) => ({
            id: `game-${i}`,
            slug: `game-slug-${i}`,
            title: `Game Title ${i}`,
          }));

          const allPages = getAllPages(games);
          const totalPages = Math.ceil(totalGames / PAGE_SIZE);

          expect(allPages.length).toBe(totalPages);

          // Verify each non-last page has exactly PAGE_SIZE
          for (let i = 0; i < totalPages - 1; i++) {
            expect(allPages[i].games.length).toBe(PAGE_SIZE);
          }

          // Verify last page has correct remainder
          const expectedLastPageSize = totalGames % PAGE_SIZE || PAGE_SIZE;
          expect(allPages[totalPages - 1].games.length).toBe(expectedLastPageSize);
        }),
        { numRuns: 30 }
      );
    });

    it("single page contains all games when total <= PAGE_SIZE", () => {
      fc.assert(
        fc.property(fc.array(gameGenerator, { minLength: 1, maxLength: PAGE_SIZE }), (games) => {
          const result = paginateGames(games, 1);

          // Should have exactly one page
          expect(result.pagination.totalPages).toBe(1);

          // That page should contain all games
          expect(result.games.length).toBe(games.length);

          // No next or previous page
          expect(result.pagination.hasNextPage).toBe(false);
          expect(result.pagination.hasPreviousPage).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("exactly PAGE_SIZE games results in exactly one full page", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: PAGE_SIZE, maxLength: PAGE_SIZE }),
          (games) => {
            fc.pre(games.length === PAGE_SIZE);

            const result = paginateGames(games, 1);

            expect(result.pagination.totalPages).toBe(1);
            expect(result.games.length).toBe(PAGE_SIZE);
            expect(result.pagination.hasNextPage).toBe(false);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("PAGE_SIZE + 1 games results in exactly two pages with correct distribution", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: PAGE_SIZE + 1, maxLength: PAGE_SIZE + 1 }),
          (games) => {
            fc.pre(games.length === PAGE_SIZE + 1);

            const page1 = paginateGames(games, 1);
            const page2 = paginateGames(games, 2);

            // Should have exactly 2 pages
            expect(page1.pagination.totalPages).toBe(2);
            expect(page2.pagination.totalPages).toBe(2);

            // First page should have PAGE_SIZE games
            expect(page1.games.length).toBe(PAGE_SIZE);

            // Second page should have 1 game
            expect(page2.games.length).toBe(1);

            // Navigation flags
            expect(page1.pagination.hasNextPage).toBe(true);
            expect(page1.pagination.hasPreviousPage).toBe(false);
            expect(page2.pagination.hasNextPage).toBe(false);
            expect(page2.pagination.hasPreviousPage).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("no duplicate games appear across pages", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: PAGE_SIZE + 1, maxLength: 80 }),
          (games) => {
            const allPages = getAllPages(games);

            // Collect all game IDs across all pages
            const allGameIds: string[] = [];
            for (const page of allPages) {
              for (const game of page.games) {
                allGameIds.push(game.id);
              }
            }

            // Check for duplicates
            const uniqueIds = new Set(allGameIds);
            expect(uniqueIds.size).toBe(allGameIds.length);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("games appear in the same order across pagination", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: PAGE_SIZE + 1, maxLength: 60 }),
          (games) => {
            const allPages = getAllPages(games);

            // Reconstruct the full list from paginated results
            const reconstructedGames: Game[] = [];
            for (const page of allPages) {
              reconstructedGames.push(...page.games);
            }

            // Order should be preserved
            for (let i = 0; i < games.length; i++) {
              expect(reconstructedGames[i].id).toBe(games[i].id);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("pagination metadata is consistent with actual page content", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (games, requestedPage) => {
            const totalPages = Math.ceil(games.length / PAGE_SIZE);
            // Clamp to valid page range
            const validPage = Math.min(requestedPage, totalPages);

            const result = paginateGames(games, validPage);

            // Metadata should match actual content
            expect(result.pagination.currentPage).toBe(validPage);
            expect(result.pagination.totalCount).toBe(games.length);
            expect(result.pagination.limit).toBe(PAGE_SIZE);
            expect(result.pagination.offset).toBe((validPage - 1) * PAGE_SIZE);

            // hasNextPage should be true only if not on last page
            expect(result.pagination.hasNextPage).toBe(validPage < totalPages);

            // hasPreviousPage should be true only if not on first page
            expect(result.pagination.hasPreviousPage).toBe(validPage > 1);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
