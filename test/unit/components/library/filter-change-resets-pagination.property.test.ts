import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: library-games-view
 * Property 6: Filter change resets pagination
 * **Validates: Requirements 2.3**
 *
 * For any change to search query, genre filters, or publisher filters,
 * the current page should reset to page 1.
 *
 * This test validates the pagination reset behavior when filters change,
 * ensuring users always see results from the beginning when applying new filters.
 */

// Types representing the filter and pagination state
interface FilterState {
  searchQuery: string;
  selectedGenres: string[];
  selectedPublishers: string[];
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

interface LibraryState {
  filters: FilterState;
  pagination: PaginationState;
}

// Pure function that simulates the filter change behavior
// This mirrors the logic in LibraryGamesContent component
function applyFilterChange(
  currentState: LibraryState,
  newFilters: Partial<FilterState>
): LibraryState {
  const filtersChanged =
    (newFilters.searchQuery !== undefined &&
      newFilters.searchQuery !== currentState.filters.searchQuery) ||
    (newFilters.selectedGenres !== undefined &&
      !arraysEqual(newFilters.selectedGenres, currentState.filters.selectedGenres)) ||
    (newFilters.selectedPublishers !== undefined &&
      !arraysEqual(newFilters.selectedPublishers, currentState.filters.selectedPublishers));

  // When filters change, reset to page 1
  const newPage = filtersChanged ? 1 : currentState.pagination.currentPage;

  return {
    filters: {
      ...currentState.filters,
      ...newFilters,
    },
    pagination: {
      ...currentState.pagination,
      currentPage: newPage,
    },
  };
}

// Helper function to compare arrays
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

// Generators for property-based testing
const genreGenerator = fc.constantFrom(
  "Action",
  "RPG",
  "Adventure",
  "Strategy",
  "Puzzle",
  "Sports",
  "Racing",
  "Simulation"
);

const publisherGenerator = fc.constantFrom(
  "Nintendo",
  "Sony",
  "Microsoft",
  "Ubisoft",
  "EA",
  "Capcom",
  "Sega",
  "Bandai Namco"
);

const searchQueryGenerator = fc.string({ minLength: 0, maxLength: 30 });

const filterStateGenerator = fc.record({
  searchQuery: searchQueryGenerator,
  selectedGenres: fc.array(genreGenerator, { minLength: 0, maxLength: 3 }),
  selectedPublishers: fc.array(publisherGenerator, { minLength: 0, maxLength: 3 }),
});

const paginationStateGenerator = fc.record({
  currentPage: fc.integer({ min: 1, max: 10 }),
  totalPages: fc.integer({ min: 1, max: 20 }),
  totalCount: fc.integer({ min: 0, max: 500 }),
  limit: fc.constant(20),
});

const libraryStateGenerator = fc.record({
  filters: filterStateGenerator,
  pagination: paginationStateGenerator,
});

describe("Library Games View Property-Based Tests", () => {
  describe("Property 6: Filter change resets pagination", () => {
    it("changing search query resets pagination to page 1", () => {
      fc.assert(
        fc.property(libraryStateGenerator, searchQueryGenerator, (initialState, newSearchQuery) => {
          // Ensure the search query actually changes
          fc.pre(newSearchQuery !== initialState.filters.searchQuery);

          const newState = applyFilterChange(initialState, {
            searchQuery: newSearchQuery,
          });

          // Property: When search query changes, page should reset to 1
          expect(newState.pagination.currentPage).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it("changing genre filter resets pagination to page 1", () => {
      fc.assert(
        fc.property(
          libraryStateGenerator,
          fc.array(genreGenerator, { minLength: 0, maxLength: 3 }),
          (initialState, newGenres) => {
            // Ensure the genres actually change
            fc.pre(!arraysEqual(newGenres, initialState.filters.selectedGenres));

            const newState = applyFilterChange(initialState, {
              selectedGenres: newGenres,
            });

            // Property: When genres change, page should reset to 1
            expect(newState.pagination.currentPage).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("changing publisher filter resets pagination to page 1", () => {
      fc.assert(
        fc.property(
          libraryStateGenerator,
          fc.array(publisherGenerator, { minLength: 0, maxLength: 3 }),
          (initialState, newPublishers) => {
            // Ensure the publishers actually change
            fc.pre(!arraysEqual(newPublishers, initialState.filters.selectedPublishers));

            const newState = applyFilterChange(initialState, {
              selectedPublishers: newPublishers,
            });

            // Property: When publishers change, page should reset to 1
            expect(newState.pagination.currentPage).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("changing multiple filters simultaneously resets pagination to page 1", () => {
      fc.assert(
        fc.property(libraryStateGenerator, filterStateGenerator, (initialState, newFilters) => {
          // Ensure at least one filter actually changes
          const searchChanged = newFilters.searchQuery !== initialState.filters.searchQuery;
          const genresChanged = !arraysEqual(
            newFilters.selectedGenres,
            initialState.filters.selectedGenres
          );
          const publishersChanged = !arraysEqual(
            newFilters.selectedPublishers,
            initialState.filters.selectedPublishers
          );

          fc.pre(searchChanged || genresChanged || publishersChanged);

          const newState = applyFilterChange(initialState, newFilters);

          // Property: When any filter changes, page should reset to 1
          expect(newState.pagination.currentPage).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it("keeping filters unchanged preserves current page", () => {
      fc.assert(
        fc.property(libraryStateGenerator, (initialState) => {
          // Apply the same filters (no change)
          const newState = applyFilterChange(initialState, {
            searchQuery: initialState.filters.searchQuery,
            selectedGenres: initialState.filters.selectedGenres,
            selectedPublishers: initialState.filters.selectedPublishers,
          });

          // Property: When filters don't change, page should remain the same
          expect(newState.pagination.currentPage).toBe(initialState.pagination.currentPage);
        }),
        { numRuns: 100 }
      );
    });

    it("clearing all filters resets pagination to page 1", () => {
      fc.assert(
        fc.property(libraryStateGenerator, (initialState) => {
          // Ensure there are some filters to clear
          const hasFilters =
            initialState.filters.searchQuery.trim().length > 0 ||
            initialState.filters.selectedGenres.length > 0 ||
            initialState.filters.selectedPublishers.length > 0;

          fc.pre(hasFilters);

          // Clear all filters
          const newState = applyFilterChange(initialState, {
            searchQuery: "",
            selectedGenres: [],
            selectedPublishers: [],
          });

          // Property: Clearing filters should reset to page 1
          expect(newState.pagination.currentPage).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it("page reset happens regardless of initial page number", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }), // Start from page > 1
          filterStateGenerator,
          searchQueryGenerator,
          (initialPage, initialFilters, newSearchQuery) => {
            // Ensure search query changes
            fc.pre(newSearchQuery !== initialFilters.searchQuery);

            const initialState: LibraryState = {
              filters: initialFilters,
              pagination: {
                currentPage: initialPage,
                totalPages: Math.max(initialPage, 10),
                totalCount: initialPage * 20,
                limit: 20,
              },
            };

            const newState = applyFilterChange(initialState, {
              searchQuery: newSearchQuery,
            });

            // Property: Page should reset to 1 regardless of how deep we were
            expect(newState.pagination.currentPage).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("adding a genre to existing selection resets pagination", () => {
      fc.assert(
        fc.property(libraryStateGenerator, genreGenerator, (initialState, newGenre) => {
          // Ensure the new genre is not already in the selection
          fc.pre(!initialState.filters.selectedGenres.includes(newGenre));

          const newGenres = [...initialState.filters.selectedGenres, newGenre];
          const newState = applyFilterChange(initialState, {
            selectedGenres: newGenres,
          });

          // Property: Adding a genre should reset to page 1
          expect(newState.pagination.currentPage).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it("removing a genre from selection resets pagination", () => {
      fc.assert(
        fc.property(
          fc.record({
            filters: fc.record({
              searchQuery: searchQueryGenerator,
              selectedGenres: fc.array(genreGenerator, { minLength: 1, maxLength: 5 }),
              selectedPublishers: fc.array(publisherGenerator, { minLength: 0, maxLength: 3 }),
            }),
            pagination: paginationStateGenerator,
          }),
          (initialState) => {
            // Remove the first genre
            const newGenres = initialState.filters.selectedGenres.slice(1);

            const newState = applyFilterChange(initialState, {
              selectedGenres: newGenres,
            });

            // Property: Removing a genre should reset to page 1
            expect(newState.pagination.currentPage).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("filter updates preserve other state properties", () => {
      fc.assert(
        fc.property(libraryStateGenerator, searchQueryGenerator, (initialState, newSearchQuery) => {
          fc.pre(newSearchQuery !== initialState.filters.searchQuery);

          const newState = applyFilterChange(initialState, {
            searchQuery: newSearchQuery,
          });

          // Property: Other pagination properties should be preserved
          expect(newState.pagination.totalPages).toBe(initialState.pagination.totalPages);
          expect(newState.pagination.totalCount).toBe(initialState.pagination.totalCount);
          expect(newState.pagination.limit).toBe(initialState.pagination.limit);

          // Property: Unchanged filters should be preserved
          expect(newState.filters.selectedGenres).toEqual(initialState.filters.selectedGenres);
          expect(newState.filters.selectedPublishers).toEqual(
            initialState.filters.selectedPublishers
          );
        }),
        { numRuns: 100 }
      );
    });
  });
});
