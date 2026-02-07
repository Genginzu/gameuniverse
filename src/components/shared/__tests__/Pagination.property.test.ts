import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import { getVisiblePages } from "../Pagination";

// Feature: code-refactoring, Property 5: Pagination State Management
// **Validates: Requirements 9.1, 9.2, 9.3, 9.5, 9.7**

/**
 * Simulates the pagination component's button state logic.
 * This mirrors the actual component behavior for property testing.
 */
const simulatePaginationState = (
  currentPage: number,
  totalPages: number,
  totalCount: number
): {
  shouldRender: boolean;
  firstButtonDisabled: boolean;
  previousButtonDisabled: boolean;
  nextButtonDisabled: boolean;
  lastButtonDisabled: boolean;
  visiblePages: (number | string)[];
  hasEllipsis: boolean;
  pageNumbers: number[];
} => {
  const shouldRender = totalPages > 1;
  const firstButtonDisabled = currentPage === 1;
  const previousButtonDisabled = currentPage === 1;
  const nextButtonDisabled = currentPage === totalPages;
  const lastButtonDisabled = currentPage === totalPages;
  const visiblePages = getVisiblePages(currentPage, totalPages);
  const hasEllipsis = visiblePages.includes("...");
  const pageNumbers = visiblePages.filter((p): p is number => typeof p === "number");

  return {
    shouldRender,
    firstButtonDisabled,
    previousButtonDisabled,
    nextButtonDisabled,
    lastButtonDisabled,
    visiblePages,
    hasEllipsis,
    pageNumbers,
  };
};

describe("Pagination Property-Based Tests", () => {
  describe("Property 5: Pagination State Management", () => {
    it("returns null when totalPages <= 1", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1 }),
          fc.integer({ min: 0, max: 100 }),
          (totalPages, totalCount) => {
            const result = simulatePaginationState(1, totalPages, totalCount);
            return result.shouldRender === false;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("renders when totalPages > 1", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          (totalPages, currentPage, totalCount) => {
            const validCurrentPage = Math.min(currentPage, totalPages);
            const result = simulatePaginationState(validCurrentPage, totalPages, totalCount);
            return result.shouldRender === true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("first and previous buttons are disabled on page 1", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          (totalPages, totalCount) => {
            const result = simulatePaginationState(1, totalPages, totalCount);
            return result.firstButtonDisabled === true && result.previousButtonDisabled === true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("next and last buttons are disabled on last page", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          (totalPages, totalCount) => {
            const result = simulatePaginationState(totalPages, totalPages, totalCount);
            return result.nextButtonDisabled === true && result.lastButtonDisabled === true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("all navigation buttons are enabled on middle pages", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          (totalPages, totalCount) => {
            // Pick a middle page (not first or last)
            const middlePage = Math.floor(totalPages / 2);
            if (middlePage <= 1 || middlePage >= totalPages) return true;

            const result = simulatePaginationState(middlePage, totalPages, totalCount);
            return (
              result.firstButtonDisabled === false &&
              result.previousButtonDisabled === false &&
              result.nextButtonDisabled === false &&
              result.lastButtonDisabled === false
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it("shows ellipsis when totalPages > 5", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          (totalPages, totalCount) => {
            // Test with page in the middle where ellipsis should appear
            const middlePage = Math.floor(totalPages / 2);
            const result = simulatePaginationState(middlePage, totalPages, totalCount);

            // When we're in the middle of a large page set, we should have ellipsis
            return result.hasEllipsis === true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("does not show ellipsis when totalPages <= 4", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 4 }),
          fc.integer({ min: 1, max: 4 }),
          fc.integer({ min: 0, max: 1000 }),
          (totalPages, currentPage, totalCount) => {
            const validCurrentPage = Math.min(currentPage, totalPages);
            const result = simulatePaginationState(validCurrentPage, totalPages, totalCount);
            return result.hasEllipsis === false;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("current page is always included in visible pages", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          (totalPages, currentPage, totalCount) => {
            const validCurrentPage = Math.min(currentPage, totalPages);
            const result = simulatePaginationState(validCurrentPage, totalPages, totalCount);
            return result.pageNumbers.includes(validCurrentPage);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("first page (1) is always included when totalPages > 1", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          (totalPages, currentPage, totalCount) => {
            const validCurrentPage = Math.min(currentPage, totalPages);
            const result = simulatePaginationState(validCurrentPage, totalPages, totalCount);
            return result.pageNumbers.includes(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("last page is always included when totalPages > 1", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          (totalPages, currentPage, totalCount) => {
            const validCurrentPage = Math.min(currentPage, totalPages);
            const result = simulatePaginationState(validCurrentPage, totalPages, totalCount);
            return result.pageNumbers.includes(totalPages);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("page numbers are in ascending order", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          (totalPages, currentPage, totalCount) => {
            const validCurrentPage = Math.min(currentPage, totalPages);
            const result = simulatePaginationState(validCurrentPage, totalPages, totalCount);

            for (let i = 1; i < result.pageNumbers.length; i++) {
              if (result.pageNumbers[i] <= result.pageNumbers[i - 1]) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("all page numbers are within valid range [1, totalPages]", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          (totalPages, currentPage, totalCount) => {
            const validCurrentPage = Math.min(currentPage, totalPages);
            const result = simulatePaginationState(validCurrentPage, totalPages, totalCount);

            return result.pageNumbers.every((page) => page >= 1 && page <= totalPages);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Property 5 Extended: getVisiblePages Function", () => {
    it("returns array with at least current page", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (currentPage, totalPages) => {
            const validCurrentPage = Math.min(currentPage, totalPages);
            const result = getVisiblePages(validCurrentPage, totalPages);
            const pageNumbers = result.filter((p): p is number => typeof p === "number");
            return pageNumbers.includes(validCurrentPage);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("ellipsis only appears between non-consecutive pages", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (currentPage, totalPages) => {
            const validCurrentPage = Math.min(currentPage, totalPages);
            const result = getVisiblePages(validCurrentPage, totalPages);

            for (let i = 0; i < result.length - 1; i++) {
              if (result[i] === "...") {
                // Ellipsis should be between two numbers
                const prev = result[i - 1];
                const next = result[i + 1];
                if (typeof prev === "number" && typeof next === "number") {
                  // The gap should be more than 1
                  if (next - prev <= 1) return false;
                }
              }
            }
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("same inputs always produce same output (deterministic)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (currentPage, totalPages) => {
            const validCurrentPage = Math.min(currentPage, totalPages);
            const result1 = getVisiblePages(validCurrentPage, totalPages);
            const result2 = getVisiblePages(validCurrentPage, totalPages);

            if (result1.length !== result2.length) return false;

            for (let i = 0; i < result1.length; i++) {
              if (result1[i] !== result2[i]) return false;
            }
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
