import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: game-library
// **Property 3: Search Title Matching**
// **Property 4: Search State Reset**
// **Validates: Requirements 2.1, 2.4, 2.5**

/**
 * Simulates the search matching logic used in the games API.
 * The API performs case-insensitive matching where each word in the search query
 * must appear somewhere in the title.
 */
function matchesSearchQuery(title: string, searchQuery: string): boolean {
  if (!searchQuery.trim()) {
    return true; // Empty search matches all games
  }

  const searchWords = searchQuery.trim().split(/\s+/).filter(Boolean);
  const lowerTitle = title.toLowerCase();

  // Each word must appear in the title (case-insensitive)
  return searchWords.every((word) => lowerTitle.includes(word.toLowerCase()));
}

/**
 * Filters games based on search query using the same logic as the API.
 */
function filterGamesBySearch<T extends { title: string }>(games: T[], searchQuery: string): T[] {
  if (!searchQuery.trim()) {
    return games;
  }

  return games.filter((game) => matchesSearchQuery(game.title, searchQuery));
}

/**
 * Simulates the search state management in AllGamesContent.
 * When search is cleared, all games should be displayed.
 */
interface SearchState {
  searchQuery: string;
  displayedGames: { id: string; title: string }[];
  allGames: { id: string; title: string }[];
}

function createSearchState(allGames: { id: string; title: string }[]): SearchState {
  return {
    searchQuery: "",
    displayedGames: [...allGames],
    allGames: [...allGames],
  };
}

function applySearch(state: SearchState, searchQuery: string): SearchState {
  const filteredGames = filterGamesBySearch(state.allGames, searchQuery);
  return {
    ...state,
    searchQuery,
    displayedGames: filteredGames,
  };
}

function clearSearch(state: SearchState): SearchState {
  return {
    ...state,
    searchQuery: "",
    displayedGames: [...state.allGames],
  };
}

// Game generator for property-based testing
const gameGenerator = () =>
  fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  });

describe("GameSearch Property-Based Tests", () => {
  describe("Property 3: Search Title Matching", () => {
    it("search results should only include games whose titles contain the search query (case-insensitive)", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator(), { minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
          (games, searchQuery) => {
            const results = filterGamesBySearch(games, searchQuery);

            // All results must match the search query
            return results.every((game) => matchesSearchQuery(game.title, searchQuery));
          }
        ),
        { numRuns: 30 }
      );
    });

    it("search should be case-insensitive", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator(), { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0),
          (games, searchQuery) => {
            const lowerResults = filterGamesBySearch(games, searchQuery.toLowerCase());
            const upperResults = filterGamesBySearch(games, searchQuery.toUpperCase());
            const mixedResults = filterGamesBySearch(games, searchQuery);

            // All case variations should return the same results
            const lowerIds = new Set(lowerResults.map((g) => g.id));
            const upperIds = new Set(upperResults.map((g) => g.id));
            const mixedIds = new Set(mixedResults.map((g) => g.id));

            return (
              lowerIds.size === upperIds.size &&
              lowerIds.size === mixedIds.size &&
              [...lowerIds].every((id) => upperIds.has(id) && mixedIds.has(id))
            );
          }
        ),
        { numRuns: 30 }
      );
    });

    it("empty search query should return all games", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator(), { minLength: 0, maxLength: 50 }),
          fc.constantFrom("", "   ", "\t", "\n"),
          (games, emptyQuery) => {
            const results = filterGamesBySearch(games, emptyQuery);
            return results.length === games.length;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("search with no matches should return empty result set", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              title: fc.constant("Game Title"),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (games) => {
            // Search for something that definitely won't match
            const impossibleQuery = "ZZZZXXXXXQQQQ12345";
            const results = filterGamesBySearch(games, impossibleQuery);
            return results.length === 0;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("multi-word search should match games containing all words", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              title: fc.constantFrom(
                "Dragon Quest XI",
                "Dragon Age Origins",
                "Quest for Glory",
                "Final Fantasy",
                "Dragon Ball Z"
              ),
            }),
            { minLength: 3, maxLength: 10 }
          ),
          (games) => {
            const results = filterGamesBySearch(games, "Dragon Quest");

            // Results should only include games with both "Dragon" AND "Quest"
            return results.every(
              (game) =>
                game.title.toLowerCase().includes("dragon") &&
                game.title.toLowerCase().includes("quest")
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Property 4: Search State Reset", () => {
    it("clearing search should restore display to show all available games", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator(), { minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
          (games, searchQuery) => {
            // Create initial state with all games
            const initialState = createSearchState(games);

            // Apply search (may filter some games)
            const searchedState = applySearch(initialState, searchQuery);

            // Clear search
            const clearedState = clearSearch(searchedState);

            // After clearing, all games should be displayed
            return (
              clearedState.displayedGames.length === games.length &&
              clearedState.searchQuery === "" &&
              games.every((game) => clearedState.displayedGames.some((g) => g.id === game.id))
            );
          }
        ),
        { numRuns: 30 }
      );
    });

    it("search state should be independent of previous searches", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator(), { minLength: 5, maxLength: 30 }),
          fc.array(
            fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0),
            { minLength: 2, maxLength: 5 }
          ),
          (games, searchQueries) => {
            let state = createSearchState(games);

            // Apply multiple searches in sequence
            for (const query of searchQueries) {
              state = applySearch(state, query);
            }

            // Clear search
            state = clearSearch(state);

            // After clearing, state should be as if no searches were ever made
            const freshState = createSearchState(games);
            return (
              state.displayedGames.length === freshState.displayedGames.length &&
              state.searchQuery === freshState.searchQuery
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it("clearing search after filtering should restore original game count", () => {
      fc.assert(
        fc.property(fc.array(gameGenerator(), { minLength: 10, maxLength: 50 }), (games) => {
          const initialState = createSearchState(games);
          const originalCount = initialState.displayedGames.length;

          // Apply a restrictive search that likely filters some games
          const searchedState = applySearch(initialState, "xyz");

          // Clear search
          const clearedState = clearSearch(searchedState);

          // Count should be restored
          return clearedState.displayedGames.length === originalCount;
        }),
        { numRuns: 50 }
      );
    });

    it("clearing an empty search should have no effect", () => {
      fc.assert(
        fc.property(fc.array(gameGenerator(), { minLength: 1, maxLength: 30 }), (games) => {
          const initialState = createSearchState(games);

          // Clear without any search applied
          const clearedState = clearSearch(initialState);

          // State should be unchanged
          return (
            clearedState.displayedGames.length === initialState.displayedGames.length &&
            clearedState.searchQuery === initialState.searchQuery
          );
        }),
        { numRuns: 50 }
      );
    });
  });
});
