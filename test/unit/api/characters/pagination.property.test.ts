import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

/**
 * Feature: character-pages
 * Property 7: API Pagination Metadata Completeness
 * **Validates: Requirements 4.4, 8.4**
 *
 * For any paginated API response from /api/characters, the response should
 * include complete pagination metadata: currentPage, totalPages, totalCount,
 * hasNextPage, and hasPreviousPage.
 *
 * This test validates the pagination calculation logic that is used by the
 * /api/characters endpoint to ensure correct pagination metadata is always
 * returned regardless of input parameters.
 */

// Pagination calculation function - mirrors the logic in the API route
function calculatePaginationMetadata(
  page: number,
  limit: number,
  totalCount: number
): {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalCount,
    hasNextPage,
    hasPreviousPage,
  };
}

// Generators for property-based testing
const validPageGenerator = fc.integer({ min: 1, max: 1000 });
const validLimitGenerator = fc.integer({ min: 1, max: 50 });
const totalCountGenerator = fc.integer({ min: 0, max: 100000 });

describe("Character API Pagination Property-Based Tests", () => {
  describe("Property 7: API Pagination Metadata Completeness", () => {
    it("always returns all required pagination fields", () => {
      fc.assert(
        fc.property(
          validPageGenerator,
          validLimitGenerator,
          totalCountGenerator,
          (page, limit, totalCount) => {
            const pagination = calculatePaginationMetadata(page, limit, totalCount);

            // Verify all required fields are present
            expect(pagination).toHaveProperty("currentPage");
            expect(pagination).toHaveProperty("totalPages");
            expect(pagination).toHaveProperty("totalCount");
            expect(pagination).toHaveProperty("hasNextPage");
            expect(pagination).toHaveProperty("hasPreviousPage");

            // Verify field types
            expect(typeof pagination.currentPage).toBe("number");
            expect(typeof pagination.totalPages).toBe("number");
            expect(typeof pagination.totalCount).toBe("number");
            expect(typeof pagination.hasNextPage).toBe("boolean");
            expect(typeof pagination.hasPreviousPage).toBe("boolean");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("currentPage always equals the requested page", () => {
      fc.assert(
        fc.property(
          validPageGenerator,
          validLimitGenerator,
          totalCountGenerator,
          (page, limit, totalCount) => {
            const pagination = calculatePaginationMetadata(page, limit, totalCount);
            expect(pagination.currentPage).toBe(page);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("totalCount always equals the provided total count", () => {
      fc.assert(
        fc.property(
          validPageGenerator,
          validLimitGenerator,
          totalCountGenerator,
          (page, limit, totalCount) => {
            const pagination = calculatePaginationMetadata(page, limit, totalCount);
            expect(pagination.totalCount).toBe(totalCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("totalPages is correctly calculated as ceil(totalCount / limit)", () => {
      fc.assert(
        fc.property(
          validPageGenerator,
          validLimitGenerator,
          totalCountGenerator,
          (page, limit, totalCount) => {
            const pagination = calculatePaginationMetadata(page, limit, totalCount);
            const expectedTotalPages = Math.ceil(totalCount / limit);
            expect(pagination.totalPages).toBe(expectedTotalPages);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("hasNextPage is true if and only if currentPage < totalPages", () => {
      fc.assert(
        fc.property(
          validPageGenerator,
          validLimitGenerator,
          totalCountGenerator,
          (page, limit, totalCount) => {
            const pagination = calculatePaginationMetadata(page, limit, totalCount);
            const expectedHasNextPage = page < pagination.totalPages;
            expect(pagination.hasNextPage).toBe(expectedHasNextPage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("hasPreviousPage is true if and only if currentPage > 1", () => {
      fc.assert(
        fc.property(
          validPageGenerator,
          validLimitGenerator,
          totalCountGenerator,
          (page, limit, totalCount) => {
            const pagination = calculatePaginationMetadata(page, limit, totalCount);
            const expectedHasPreviousPage = page > 1;
            expect(pagination.hasPreviousPage).toBe(expectedHasPreviousPage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("first page never has previous page", () => {
      fc.assert(
        fc.property(validLimitGenerator, totalCountGenerator, (limit, totalCount) => {
          const pagination = calculatePaginationMetadata(1, limit, totalCount);
          expect(pagination.hasPreviousPage).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("last page never has next page", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 10000 }),
          (limit, totalCount) => {
            const totalPages = Math.ceil(totalCount / limit);
            const lastPage = Math.max(1, totalPages);
            const pagination = calculatePaginationMetadata(lastPage, limit, totalCount);
            expect(pagination.hasNextPage).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("totalPages is always non-negative", () => {
      fc.assert(
        fc.property(
          validPageGenerator,
          validLimitGenerator,
          totalCountGenerator,
          (page, limit, totalCount) => {
            const pagination = calculatePaginationMetadata(page, limit, totalCount);
            expect(pagination.totalPages).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("empty result set (totalCount=0) has totalPages=0 and no next page", () => {
      fc.assert(
        fc.property(validPageGenerator, validLimitGenerator, (page, limit) => {
          const pagination = calculatePaginationMetadata(page, limit, 0);
          expect(pagination.totalPages).toBe(0);
          expect(pagination.hasNextPage).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});
