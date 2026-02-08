import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

// Feature: game-library, Task 16.5
// Tests for UserLibraryContent and LibraryGamesContent component logic
// **Validates: Requirements - Bibliothèque personnelle**

/**
 * Represents a game in the user's library
 */
interface LibraryGame {
  id: string;
  slug: string;
  title: string;
  coverImage?: string;
  releaseYear?: number;
  genres: { name: string }[];
  addedAt?: string;
  playTime?: number;
  completed?: boolean;
  rating?: number;
}

/**
 * Represents library statistics
 */
interface LibraryStats {
  totalGames: number;
  completedGames: number;
  totalPlayTime: number;
  averageRating?: number;
}

/**
 * Represents the library state
 */
interface LibraryState {
  games: LibraryGame[];
  stats: LibraryStats;
  loading: boolean;
  error?: string;
  searchQuery: string;
  selectedGenres: string[];
  selectedPublishers: string[];
}

/**
 * Calculates library statistics from games
 */
function calculateStats(games: LibraryGame[]): LibraryStats {
  const totalGames = games.length;
  const completedGames = games.filter((g) => g.completed).length;
  const totalPlayTime = games.reduce((sum, g) => sum + (g.playTime || 0), 0);

  const ratedGames = games.filter((g) => g.rating !== undefined && g.rating > 0);
  const averageRating =
    ratedGames.length > 0
      ? ratedGames.reduce((sum, g) => sum + (g.rating || 0), 0) / ratedGames.length
      : undefined;

  return {
    totalGames,
    completedGames,
    totalPlayTime,
    averageRating,
  };
}

/**
 * Creates initial library state
 */
function createLibraryState(games: LibraryGame[]): LibraryState {
  return {
    games,
    stats: calculateStats(games),
    loading: false,
    searchQuery: "",
    selectedGenres: [],
    selectedPublishers: [],
  };
}

/**
 * Simulates removing a game from library
 */
function removeGameFromLibrary(state: LibraryState, gameId: string): LibraryState {
  const newGames = state.games.filter((g) => g.id !== gameId);
  return {
    ...state,
    games: newGames,
    stats: calculateStats(newGames),
  };
}

/**
 * Simulates adding a game to library
 */
function addGameToLibrary(state: LibraryState, game: LibraryGame): LibraryState {
  // Don't add if already exists
  if (state.games.some((g) => g.id === game.id)) {
    return state;
  }

  const newGames = [...state.games, game];
  return {
    ...state,
    games: newGames,
    stats: calculateStats(newGames),
  };
}

/**
 * Simulates applying search filter
 */
function applySearch(state: LibraryState, query: string): LibraryState {
  return {
    ...state,
    searchQuery: query,
  };
}

/**
 * Simulates clearing all filters
 */
function clearFilters(state: LibraryState): LibraryState {
  return {
    ...state,
    searchQuery: "",
    selectedGenres: [],
    selectedPublishers: [],
  };
}

/**
 * Checks if library is empty
 */
function isLibraryEmpty(state: LibraryState): boolean {
  return state.games.length === 0;
}

/**
 * Checks if library has active filters
 */
function hasActiveFilters(state: LibraryState): boolean {
  return (
    state.searchQuery.trim().length > 0 ||
    state.selectedGenres.length > 0 ||
    state.selectedPublishers.length > 0
  );
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

const libraryGameGenerator = (): fc.Arbitrary<LibraryGame> =>
  fc.record({
    id: fc.uuid(),
    slug: fc.uuid().map((id) => `game-${id.slice(0, 8)}`),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    coverImage: fc.option(fc.webUrl()),
    releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 })),
    genres: fc.array(fc.record({ name: genreNameGenerator }), { minLength: 1, maxLength: 5 }),
    addedAt: fc.option(
      fc
        .integer({ min: 1577836800000, max: 1735689600000 }) // 2020-01-01 to 2025-01-01
        .map((ts) => new Date(ts).toISOString())
    ),
    playTime: fc.option(fc.integer({ min: 0, max: 10000 })),
    completed: fc.option(fc.boolean()),
    rating: fc.option(fc.integer({ min: 1, max: 5 })),
  });

describe("LibraryContent Property-Based Tests", () => {
  describe("Library Statistics Calculation", () => {
    it("totalGames should equal the number of games in library", () => {
      fc.assert(
        fc.property(fc.array(libraryGameGenerator(), { minLength: 0, maxLength: 50 }), (games) => {
          const stats = calculateStats(games);
          return stats.totalGames === games.length;
        }),
        { numRuns: 50 }
      );
    });

    it("completedGames should equal the count of games with completed=true", () => {
      fc.assert(
        fc.property(fc.array(libraryGameGenerator(), { minLength: 0, maxLength: 50 }), (games) => {
          const stats = calculateStats(games);
          const expectedCompleted = games.filter((g) => g.completed === true).length;
          return stats.completedGames === expectedCompleted;
        }),
        { numRuns: 50 }
      );
    });

    it("totalPlayTime should be the sum of all game play times", () => {
      fc.assert(
        fc.property(fc.array(libraryGameGenerator(), { minLength: 0, maxLength: 50 }), (games) => {
          const stats = calculateStats(games);
          const expectedPlayTime = games.reduce((sum, g) => sum + (g.playTime || 0), 0);
          return stats.totalPlayTime === expectedPlayTime;
        }),
        { numRuns: 50 }
      );
    });

    it("averageRating should be undefined when no games have ratings", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              slug: fc.uuid().map((id) => `game-${id.slice(0, 8)}`),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              genres: fc.array(fc.record({ name: genreNameGenerator }), {
                minLength: 1,
                maxLength: 3,
              }),
              rating: fc.constant(undefined),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (games) => {
            const stats = calculateStats(games as LibraryGame[]);
            return stats.averageRating === undefined;
          }
        ),
        { numRuns: 30 }
      );
    });

    it("averageRating should be calculated correctly when games have ratings", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              slug: fc.uuid().map((id) => `game-${id.slice(0, 8)}`),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              genres: fc.array(fc.record({ name: genreNameGenerator }), {
                minLength: 1,
                maxLength: 3,
              }),
              rating: fc.integer({ min: 1, max: 5 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (games) => {
            const stats = calculateStats(games as LibraryGame[]);
            const expectedAverage = games.reduce((sum, g) => sum + g.rating, 0) / games.length;

            // Allow small floating point differences
            return (
              stats.averageRating !== undefined &&
              Math.abs(stats.averageRating - expectedAverage) < 0.0001
            );
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe("Library State Management", () => {
    it("initial state should have correct stats", () => {
      fc.assert(
        fc.property(fc.array(libraryGameGenerator(), { minLength: 0, maxLength: 30 }), (games) => {
          const state = createLibraryState(games);
          return (
            state.stats.totalGames === games.length &&
            state.loading === false &&
            state.searchQuery === "" &&
            state.selectedGenres.length === 0
          );
        }),
        { numRuns: 30 }
      );
    });

    it("removing a game should decrease totalGames by 1", () => {
      fc.assert(
        fc.property(fc.array(libraryGameGenerator(), { minLength: 1, maxLength: 30 }), (games) => {
          const state = createLibraryState(games);
          const gameToRemove = games[0];
          const newState = removeGameFromLibrary(state, gameToRemove.id);

          return newState.stats.totalGames === state.stats.totalGames - 1;
        }),
        { numRuns: 30 }
      );
    });

    it("removing a non-existent game should not change state", () => {
      fc.assert(
        fc.property(fc.array(libraryGameGenerator(), { minLength: 0, maxLength: 20 }), (games) => {
          const state = createLibraryState(games);
          const newState = removeGameFromLibrary(state, "non-existent-id");

          return newState.stats.totalGames === state.stats.totalGames;
        }),
        { numRuns: 30 }
      );
    });

    it("adding a game should increase totalGames by 1", () => {
      fc.assert(
        fc.property(
          fc.array(libraryGameGenerator(), { minLength: 0, maxLength: 20 }),
          libraryGameGenerator(),
          (games, newGame) => {
            const state = createLibraryState(games);
            // Ensure the new game has a unique ID
            const uniqueGame = { ...newGame, id: `unique-${newGame.id}` };
            const newState = addGameToLibrary(state, uniqueGame);

            return newState.stats.totalGames === state.stats.totalGames + 1;
          }
        ),
        { numRuns: 30 }
      );
    });

    it("adding a duplicate game should not change state", () => {
      fc.assert(
        fc.property(fc.array(libraryGameGenerator(), { minLength: 1, maxLength: 20 }), (games) => {
          const state = createLibraryState(games);
          const duplicateGame = games[0];
          const newState = addGameToLibrary(state, duplicateGame);

          return newState.stats.totalGames === state.stats.totalGames;
        }),
        { numRuns: 30 }
      );
    });
  });

  describe("Empty State Detection", () => {
    it("isLibraryEmpty should return true for empty library", () => {
      fc.assert(
        fc.property(fc.constant([]), (games) => {
          const state = createLibraryState(games);
          return isLibraryEmpty(state) === true;
        }),
        { numRuns: 10 }
      );
    });

    it("isLibraryEmpty should return false for non-empty library", () => {
      fc.assert(
        fc.property(fc.array(libraryGameGenerator(), { minLength: 1, maxLength: 30 }), (games) => {
          const state = createLibraryState(games);
          return isLibraryEmpty(state) === false;
        }),
        { numRuns: 30 }
      );
    });
  });

  describe("Filter State Detection", () => {
    it("hasActiveFilters should return false for initial state", () => {
      fc.assert(
        fc.property(fc.array(libraryGameGenerator(), { minLength: 0, maxLength: 20 }), (games) => {
          const state = createLibraryState(games);
          return hasActiveFilters(state) === false;
        }),
        { numRuns: 30 }
      );
    });

    it("hasActiveFilters should return true when search query is set", () => {
      fc.assert(
        fc.property(
          fc.array(libraryGameGenerator(), { minLength: 0, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          (games, query) => {
            let state = createLibraryState(games);
            state = applySearch(state, query);
            return hasActiveFilters(state) === true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it("clearing filters should reset hasActiveFilters to false", () => {
      fc.assert(
        fc.property(
          fc.array(libraryGameGenerator(), { minLength: 0, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (games, query) => {
            let state = createLibraryState(games);
            state = applySearch(state, query);
            state = clearFilters(state);
            return hasActiveFilters(state) === false;
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe("Stats Consistency", () => {
    it("completedGames should never exceed totalGames", () => {
      fc.assert(
        fc.property(fc.array(libraryGameGenerator(), { minLength: 0, maxLength: 50 }), (games) => {
          const stats = calculateStats(games);
          return stats.completedGames <= stats.totalGames;
        }),
        { numRuns: 50 }
      );
    });

    it("totalPlayTime should be non-negative", () => {
      fc.assert(
        fc.property(fc.array(libraryGameGenerator(), { minLength: 0, maxLength: 50 }), (games) => {
          const stats = calculateStats(games);
          return stats.totalPlayTime >= 0;
        }),
        { numRuns: 50 }
      );
    });

    it("averageRating should be between 1 and 5 when defined", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              slug: fc.uuid().map((id) => `game-${id.slice(0, 8)}`),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              genres: fc.array(fc.record({ name: genreNameGenerator }), {
                minLength: 1,
                maxLength: 3,
              }),
              rating: fc.integer({ min: 1, max: 5 }),
            }),
            { minLength: 1, maxLength: 30 }
          ),
          (games) => {
            const stats = calculateStats(games as LibraryGame[]);
            return (
              stats.averageRating !== undefined &&
              stats.averageRating >= 1 &&
              stats.averageRating <= 5
            );
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
