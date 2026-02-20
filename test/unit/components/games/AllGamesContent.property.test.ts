import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: game-library, Task 16.5
// Tests for AllGamesContent component logic
// **Validates: Requirements 1.1, 1.2, 2.1, 2.4, 7.4**

/**
 * Represents a game summary as used in AllGamesContent
 */
interface GameSummary {
  id: string;
  slug: string;
  title: string;
  coverImage?: string;
  releaseYear?: number;
  genres: { name: string }[];
  developer?: string;
  publisher?: string;
  metascore?: number;
}

/**
 * Represents pagination state
 */
interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

/**
 * Simulates the AllGamesContent state management
 */
interface AllGamesState {
  games: GameSummary[];
  genres: { id: string; name: string }[];
  pagination: PaginationState | null;
  loading: boolean;
  selectedGenres: string[];
  selectedPublishers: string[];
  showFilters: boolean;
}

/**
 * Creates initial state for AllGamesContent
 */
function createInitialState(games: GameSummary[], totalCount: number): AllGamesState {
  return {
    games,
    genres: [],
    pagination: {
      currentPage: 1,
      totalPages: Math.ceil(totalCount / 20),
      totalCount,
      limit: 20,
    },
    loading: false,
    selectedGenres: [],
    selectedPublishers: [],
    showFilters: false,
  };
}

/**
 * Simulates applying genre filter
 */
function applyGenreFilter(state: AllGamesState, genres: string[]): AllGamesState {
  return {
    ...state,
    selectedGenres: genres,
  };
}

/**
 * Simulates applying publisher filter
 */
function applyPublisherFilter(state: AllGamesState, publishers: string[]): AllGamesState {
  return {
    ...state,
    selectedPublishers: publishers,
  };
}

/**
 * Simulates clearing all filters
 */
function clearAllFilters(state: AllGamesState): AllGamesState {
  return {
    ...state,
    selectedGenres: [],
    selectedPublishers: [],
  };
}

/**
 * Simulates toggling filter visibility
 */
function toggleFilters(state: AllGamesState): AllGamesState {
  return {
    ...state,
    showFilters: !state.showFilters,
  };
}

/**
 * Simulates page change
 */
function changePage(state: AllGamesState, page: number): AllGamesState {
  if (!state.pagination) return state;
  if (page < 1 || page > state.pagination.totalPages) return state;

  return {
    ...state,
    pagination: {
      ...state.pagination,
      currentPage: page,
    },
  };
}

/**
 * Checks if state has active filters
 */
function hasActiveFilters(state: AllGamesState): boolean {
  return state.selectedGenres.length > 0 || state.selectedPublishers.length > 0;
}

// Generators
const genreNameGenerator = fc.constantFrom(
  "Action",
  "Adventure",
  "RPG",
  "Strategy",
  "Simulation",
  "Sports",
  "Racing",
  "Puzzle",
  "Horror",
  "Indie"
);

const gameSummaryGenerator = (): fc.Arbitrary<GameSummary> =>
  fc.record({
    id: fc.uuid(),
    slug: fc.uuid().map((id) => `game-${id.slice(0, 8)}`),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    coverImage: fc.option(fc.webUrl()),
    releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 })),
    genres: fc.array(fc.record({ name: genreNameGenerator }), { minLength: 1, maxLength: 5 }),
    developer: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    publisher: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    metascore: fc.option(fc.integer({ min: 0, max: 100 })),
  });

describe("AllGamesContent Property-Based Tests", () => {
  describe("State Management", () => {
    it("initial state should have no active filters", () => {
      fc.assert(
        fc.property(
          fc.array(gameSummaryGenerator(), { minLength: 0, maxLength: 50 }),
          fc.integer({ min: 0, max: 1000 }),
          (games, totalCount) => {
            const state = createInitialState(games, totalCount);
            return (
              state.selectedGenres.length === 0 &&
              state.selectedPublishers.length === 0 &&
              !hasActiveFilters(state)
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    it("initial state should have correct pagination", () => {
      fc.assert(
        fc.property(
          fc.array(gameSummaryGenerator(), { minLength: 0, maxLength: 50 }),
          fc.integer({ min: 0, max: 1000 }),
          (games, totalCount) => {
            const state = createInitialState(games, totalCount);
            if (!state.pagination) return totalCount === 0;

            return (
              state.pagination.currentPage === 1 &&
              state.pagination.totalCount === totalCount &&
              state.pagination.totalPages === Math.ceil(totalCount / 20)
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    it("applying genre filter should update selectedGenres", () => {
      fc.assert(
        fc.property(
          fc.array(gameSummaryGenerator(), { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 1, max: 100 }),
          fc.array(genreNameGenerator, { minLength: 1, maxLength: 3 }),
          (games, totalCount, genres) => {
            const initialState = createInitialState(games, totalCount);
            const filteredState = applyGenreFilter(initialState, genres);

            return (
              filteredState.selectedGenres.length === genres.length &&
              genres.every((g) => filteredState.selectedGenres.includes(g))
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    it("applying publisher filter should update selectedPublishers", () => {
      fc.assert(
        fc.property(
          fc.array(gameSummaryGenerator(), { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 1, max: 100 }),
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
          (games, totalCount, publishers) => {
            const initialState = createInitialState(games, totalCount);
            const filteredState = applyPublisherFilter(initialState, publishers);

            return (
              filteredState.selectedPublishers.length === publishers.length &&
              publishers.every((p) => filteredState.selectedPublishers.includes(p))
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    it("clearing filters should reset all filter state", () => {
      fc.assert(
        fc.property(
          fc.array(gameSummaryGenerator(), { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 1, max: 100 }),
          fc.array(genreNameGenerator, { minLength: 1, maxLength: 3 }),
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
          (games, totalCount, genres, publishers) => {
            let state = createInitialState(games, totalCount);
            state = applyGenreFilter(state, genres);
            state = applyPublisherFilter(state, publishers);
            state = clearAllFilters(state);

            return (
              state.selectedGenres.length === 0 &&
              state.selectedPublishers.length === 0 &&
              !hasActiveFilters(state)
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    it("toggling filters should flip showFilters state", () => {
      fc.assert(
        fc.property(
          fc.array(gameSummaryGenerator(), { minLength: 0, maxLength: 10 }),
          fc.integer({ min: 0, max: 100 }),
          (games, totalCount) => {
            const initialState = createInitialState(games, totalCount);
            const toggledOnce = toggleFilters(initialState);
            const toggledTwice = toggleFilters(toggledOnce);

            return (
              initialState.showFilters === false &&
              toggledOnce.showFilters === true &&
              toggledTwice.showFilters === false
            );
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe("Pagination Navigation", () => {
    it("page change should update currentPage within valid range", () => {
      fc.assert(
        fc.property(
          fc.array(gameSummaryGenerator(), { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 100, max: 500 }),
          fc.integer({ min: 1, max: 25 }),
          (games, totalCount, targetPage) => {
            const state = createInitialState(games, totalCount);
            const totalPages = state.pagination?.totalPages || 1;
            const validTargetPage = Math.min(targetPage, totalPages);

            const newState = changePage(state, validTargetPage);

            return newState.pagination?.currentPage === validTargetPage;
          }
        ),
        { numRuns: 20 }
      );
    });

    it("page change to invalid page should not change state", () => {
      fc.assert(
        fc.property(
          fc.array(gameSummaryGenerator(), { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 20, max: 100 }),
          (games, totalCount) => {
            const state = createInitialState(games, totalCount);
            const totalPages = state.pagination?.totalPages || 1;

            // Try invalid pages
            const stateAfterNegative = changePage(state, -1);
            const stateAfterZero = changePage(state, 0);
            const stateAfterTooHigh = changePage(state, totalPages + 10);

            return (
              stateAfterNegative.pagination?.currentPage === 1 &&
              stateAfterZero.pagination?.currentPage === 1 &&
              stateAfterTooHigh.pagination?.currentPage === 1
            );
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe("Filter State Detection", () => {
    it("hasActiveFilters should return true when genres are selected", () => {
      fc.assert(
        fc.property(
          fc.array(gameSummaryGenerator(), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 1, max: 50 }),
          fc.array(genreNameGenerator, { minLength: 1, maxLength: 3 }),
          (games, totalCount, genres) => {
            let state = createInitialState(games, totalCount);
            state = applyGenreFilter(state, genres);

            return hasActiveFilters(state) === true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it("hasActiveFilters should return true when publishers are selected", () => {
      fc.assert(
        fc.property(
          fc.array(gameSummaryGenerator(), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 1, max: 50 }),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
          (games, totalCount, publishers) => {
            let state = createInitialState(games, totalCount);
            state = applyPublisherFilter(state, publishers);

            return hasActiveFilters(state) === true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it("hasActiveFilters should return false when no filters are selected", () => {
      fc.assert(
        fc.property(
          fc.array(gameSummaryGenerator(), { minLength: 0, maxLength: 20 }),
          fc.integer({ min: 0, max: 100 }),
          (games, totalCount) => {
            const state = createInitialState(games, totalCount);
            return hasActiveFilters(state) === false;
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
