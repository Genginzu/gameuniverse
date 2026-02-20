import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: library-games-view
 * Property 5: Pagination range correctness
 * **Validates: Requirements 2.2**
 *
 * For any valid page number N and pagination state, the games returned for page N
 * should be the correct subset based on offset calculation (offset = (N-1) * pageSize).
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
  describe("Property 5: Pagination range correctness", () => {
    it("offset calculation is correct: offset = (page - 1) * pageSize", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (games, requestedPage) => {
            const totalPages = Math.ceil(games.length / PAGE_SIZE);
            // Clamp to valid page range
            const validPage = Math.min(requestedPage, totalPages);

            const result = paginateGames(games, validPage);

            // Verify offset calculation
            const expectedOffset = (validPage - 1) * PAGE_SIZE;
            expect(result.pagination.offset).toBe(expectedOffset);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("games returned for page N start at the correct offset position", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: PAGE_SIZE + 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 5 }),
          (games, requestedPage) => {
            const totalPages = Math.ceil(games.length / PAGE_SIZE);
            const validPage = Math.min(requestedPage, totalPages);

            const result = paginateGames(games, validPage);
            const expectedOffset = (validPage - 1) * PAGE_SIZE;

            // First game on the page should be at the offset position in original array
            if (result.games.length > 0) {
              expect(result.games[0].id).toBe(games[expectedOffset].id);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("games returned for page N end at the correct position", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: PAGE_SIZE + 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 5 }),
          (games, requestedPage) => {
            const totalPages = Math.ceil(games.length / PAGE_SIZE);
            const validPage = Math.min(requestedPage, totalPages);

            const result = paginateGames(games, validPage);
            const expectedOffset = (validPage - 1) * PAGE_SIZE;
            const expectedEndIndex = Math.min(expectedOffset + PAGE_SIZE - 1, games.length - 1);

            // Last game on the page should be at the expected end position
            if (result.games.length > 0) {
              const lastGameIndex = result.games.length - 1;
              expect(result.games[lastGameIndex].id).toBe(games[expectedEndIndex].id);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("page N contains exactly the games from offset to offset + pageSize - 1", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (games, requestedPage) => {
            const totalPages = Math.ceil(games.length / PAGE_SIZE);
            const validPage = Math.min(requestedPage, totalPages);

            const result = paginateGames(games, validPage);
            const expectedOffset = (validPage - 1) * PAGE_SIZE;

            // Extract expected games using slice
            const expectedGames = games.slice(expectedOffset, expectedOffset + PAGE_SIZE);

            // Verify exact match
            expect(result.games.length).toBe(expectedGames.length);
            for (let i = 0; i < result.games.length; i++) {
              expect(result.games[i].id).toBe(expectedGames[i].id);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("consecutive pages have non-overlapping game ranges", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: PAGE_SIZE * 2 + 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 4 }),
          (games, startPage) => {
            const totalPages = Math.ceil(games.length / PAGE_SIZE);
            fc.pre(startPage < totalPages); // Ensure we can get at least 2 pages

            const page1 = paginateGames(games, startPage);
            const page2 = paginateGames(games, startPage + 1);

            // Get all IDs from both pages
            const page1Ids = new Set(page1.games.map((g) => g.id));
            const page2Ids = new Set(page2.games.map((g) => g.id));

            // No overlap between consecutive pages
            for (const id of page2Ids) {
              expect(page1Ids.has(id)).toBe(false);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("page ranges are contiguous - last game of page N is followed by first game of page N+1", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: PAGE_SIZE * 2 + 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 4 }),
          (games, startPage) => {
            const totalPages = Math.ceil(games.length / PAGE_SIZE);
            fc.pre(startPage < totalPages); // Ensure we can get at least 2 pages

            const page1 = paginateGames(games, startPage);
            const page2 = paginateGames(games, startPage + 1);

            // Last game of page 1 should be immediately before first game of page 2 in original array
            const lastGamePage1 = page1.games[page1.games.length - 1];
            const firstGamePage2 = page2.games[0];

            // Find their indices in the original array
            const lastIndex = games.findIndex((g) => g.id === lastGamePage1.id);
            const firstIndex = games.findIndex((g) => g.id === firstGamePage2.id);

            expect(firstIndex).toBe(lastIndex + 1);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("requesting page beyond total pages returns empty result", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 10 }),
          (games, extraPages) => {
            const totalPages = Math.ceil(games.length / PAGE_SIZE);
            const invalidPage = totalPages + extraPages;

            const result = paginateGames(games, invalidPage);

            // Page beyond total should return empty games array
            expect(result.games.length).toBe(0);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("all games are accessible through valid page ranges", () => {
      fc.assert(
        fc.property(fc.array(gameGenerator, { minLength: 1, maxLength: 80 }), (games) => {
          const totalPages = Math.ceil(games.length / PAGE_SIZE);

          // Collect all games from all valid pages
          const allPaginatedGames: Game[] = [];
          for (let page = 1; page <= totalPages; page++) {
            const result = paginateGames(games, page);
            allPaginatedGames.push(...result.games);
          }

          // All original games should be accessible
          expect(allPaginatedGames.length).toBe(games.length);

          // Each game should appear exactly once
          const gameIds = allPaginatedGames.map((g) => g.id);
          const uniqueIds = new Set(gameIds);
          expect(uniqueIds.size).toBe(games.length);
        }),
        { numRuns: 30 }
      );
    });

    it("offset is always a multiple of page size for valid pages", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (games, requestedPage) => {
            const totalPages = Math.ceil(games.length / PAGE_SIZE);
            const validPage = Math.min(requestedPage, totalPages);

            const result = paginateGames(games, validPage);

            // Offset should always be a multiple of PAGE_SIZE
            expect(result.pagination.offset % PAGE_SIZE).toBe(0);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("page 1 always starts at offset 0", () => {
      fc.assert(
        fc.property(fc.array(gameGenerator, { minLength: 1, maxLength: 100 }), (games) => {
          const result = paginateGames(games, 1);

          expect(result.pagination.offset).toBe(0);
          expect(result.pagination.currentPage).toBe(1);

          // First game should be the first in the original array
          if (result.games.length > 0) {
            expect(result.games[0].id).toBe(games[0].id);
          }
        }),
        { numRuns: 30 }
      );
    });
  });
});
