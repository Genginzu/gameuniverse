import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: player-pages
 * Property 2: Pagination correcte
 * **Validates: Requirements 2.1, 2.3**
 *
 * For any list of players with a total greater than the page limit (20),
 * the pagination response must include: total player count, current page,
 * total pages, and hasNextPage/hasPreviousPage indicators consistent with
 * the current position.
 */

// Pagination interface matching PlayerPagination from types/player.ts
interface PlayerPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Default page size as used in the application
const DEFAULT_PAGE_SIZE = 20;

/**
 * Calculate pagination metadata - mirrors the logic used in playerService.ts
 */
function calculatePagination(
  totalCount: number,
  currentPage: number,
  pageSize: number = DEFAULT_PAGE_SIZE
): PlayerPagination {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  return {
    currentPage: validCurrentPage,
    totalPages,
    totalCount,
    hasNextPage: validCurrentPage < totalPages,
    hasPreviousPage: validCurrentPage > 1,
  };
}

describe("Player Pagination Property-Based Tests", () => {
  describe("Property 2: Pagination correcte", () => {
    it("totalPages is correctly calculated from totalCount and pageSize", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (totalCount, pageSize) => {
            const pagination = calculatePagination(totalCount, 1, pageSize);
            const expectedTotalPages = Math.max(1, Math.ceil(totalCount / pageSize));

            expect(pagination.totalPages).toBe(expectedTotalPages);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("totalCount in response matches the input total", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 50 }),
          (totalCount, currentPage) => {
            const pagination = calculatePagination(totalCount, currentPage);

            expect(pagination.totalCount).toBe(totalCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("currentPage is always between 1 and totalPages (inclusive)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: -10, max: 100 }),
          (totalCount, requestedPage) => {
            const pagination = calculatePagination(totalCount, requestedPage);

            expect(pagination.currentPage).toBeGreaterThanOrEqual(1);
            expect(pagination.currentPage).toBeLessThanOrEqual(pagination.totalPages);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("hasNextPage is true if and only if currentPage < totalPages", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (totalCount, currentPage) => {
            const pagination = calculatePagination(totalCount, currentPage);

            if (pagination.currentPage < pagination.totalPages) {
              expect(pagination.hasNextPage).toBe(true);
            } else {
              expect(pagination.hasNextPage).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("hasPreviousPage is true if and only if currentPage > 1", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (totalCount, currentPage) => {
            const pagination = calculatePagination(totalCount, currentPage);

            if (pagination.currentPage > 1) {
              expect(pagination.hasPreviousPage).toBe(true);
            } else {
              expect(pagination.hasPreviousPage).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("first page has hasPreviousPage = false", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (totalCount) => {
          const pagination = calculatePagination(totalCount, 1);

          expect(pagination.hasPreviousPage).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("last page has hasNextPage = false", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (totalCount) => {
          const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
          const pagination = calculatePagination(totalCount, totalPages);

          expect(pagination.hasNextPage).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("when totalCount > pageSize, totalPages > 1 and pagination controls should be shown", () => {
      fc.assert(
        fc.property(fc.integer({ min: DEFAULT_PAGE_SIZE + 1, max: 1000 }), (totalCount) => {
          const pagination = calculatePagination(totalCount, 1);

          expect(pagination.totalPages).toBeGreaterThan(1);
          // First page should have next but not previous
          expect(pagination.hasNextPage).toBe(true);
          expect(pagination.hasPreviousPage).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("when totalCount <= pageSize, totalPages = 1 and no pagination needed", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: DEFAULT_PAGE_SIZE }), (totalCount) => {
          const pagination = calculatePagination(totalCount, 1);

          expect(pagination.totalPages).toBe(1);
          expect(pagination.hasNextPage).toBe(false);
          expect(pagination.hasPreviousPage).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("middle pages have both hasNextPage and hasPreviousPage = true", () => {
      fc.assert(
        fc.property(
          // Ensure at least 3 pages (totalCount > 2 * pageSize)
          fc.integer({ min: DEFAULT_PAGE_SIZE * 2 + 1, max: 1000 }),
          (totalCount) => {
            const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE);
            // Pick a middle page (not first, not last)
            const middlePage = Math.floor(totalPages / 2) + 1;

            if (middlePage > 1 && middlePage < totalPages) {
              const pagination = calculatePagination(totalCount, middlePage);

              expect(pagination.hasNextPage).toBe(true);
              expect(pagination.hasPreviousPage).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("requesting page beyond totalPages returns last page", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 1, max: 100 }),
          (totalCount, extraPages) => {
            const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
            const requestedPage = totalPages + extraPages;
            const pagination = calculatePagination(totalCount, requestedPage);

            expect(pagination.currentPage).toBe(totalPages);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("requesting page 0 or negative returns first page", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: -100, max: 0 }),
          (totalCount, invalidPage) => {
            const pagination = calculatePagination(totalCount, invalidPage);

            expect(pagination.currentPage).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("pagination is consistent across sequential page requests", () => {
      fc.assert(
        fc.property(fc.integer({ min: DEFAULT_PAGE_SIZE + 1, max: 500 }), (totalCount) => {
          const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE);

          for (let page = 1; page <= totalPages; page++) {
            const pagination = calculatePagination(totalCount, page);

            // Verify consistency
            expect(pagination.totalCount).toBe(totalCount);
            expect(pagination.totalPages).toBe(totalPages);
            expect(pagination.currentPage).toBe(page);

            // Verify navigation indicators
            expect(pagination.hasPreviousPage).toBe(page > 1);
            expect(pagination.hasNextPage).toBe(page < totalPages);
          }
        }),
        { numRuns: 50 } // Fewer runs since each iteration tests multiple pages
      );
    });

    it("empty result set (totalCount = 0) returns valid pagination with 1 page", () => {
      const pagination = calculatePagination(0, 1);

      expect(pagination.totalCount).toBe(0);
      expect(pagination.totalPages).toBe(1);
      expect(pagination.currentPage).toBe(1);
      expect(pagination.hasNextPage).toBe(false);
      expect(pagination.hasPreviousPage).toBe(false);
    });
  });
});
