import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

// Feature: game-library
// **Property 5: Genre Filter Accuracy**
// **Property 6: Genre Count Accuracy**
// **Property 7: Filter State Reset**
// **Validates: Requirements 3.1, 3.2, 3.4, 3.5**

/**
 * Represents a game with genres for filtering tests.
 */
interface GameWithGenres {
  id: string;
  title: string;
  genres: { name: string }[];
}

/**
 * Simulates the genre filtering logic used in the games API.
 * The API performs case-insensitive matching where a game matches
 * if it belongs to ANY of the selected genres (OR logic).
 */
function filterGamesByGenres(games: GameWithGenres[], selectedGenres: string[]): GameWithGenres[] {
  if (selectedGenres.length === 0) {
    return games; // No filter = all games
  }

  const lowerSelectedGenres = selectedGenres.map((g) => g.toLowerCase());

  return games.filter((game) => {
    const gameGenres = game.genres.map((g) => g.name.toLowerCase());
    // Game matches if it has ANY of the selected genres
    return lowerSelectedGenres.some((selectedGenre) => gameGenres.includes(selectedGenre));
  });
}

/**
 * Counts the number of games for each genre.
 * This simulates the genre count display in the filter panel.
 */
function countGamesByGenre(games: GameWithGenres[], genreName: string): number {
  const lowerGenre = genreName.toLowerCase();
  return games.filter((game) => game.genres.some((g) => g.name.toLowerCase() === lowerGenre))
    .length;
}

/**
 * Gets all unique genres from a list of games.
 */
function getAllGenres(games: GameWithGenres[]): string[] {
  const genreSet = new Set<string>();
  games.forEach((game) => {
    game.genres.forEach((g) => genreSet.add(g.name));
  });
  return Array.from(genreSet);
}

/**
 * Simulates the filter state management for games.
 */
interface FilterState {
  selectedGenres: string[];
  displayedGames: GameWithGenres[];
  allGames: GameWithGenres[];
}

function createFilterState(allGames: GameWithGenres[]): FilterState {
  return {
    selectedGenres: [],
    displayedGames: [...allGames],
    allGames: [...allGames],
  };
}

function applyGenreFilter(state: FilterState, selectedGenres: string[]): FilterState {
  const filteredGames = filterGamesByGenres(state.allGames, selectedGenres);
  return {
    ...state,
    selectedGenres,
    displayedGames: filteredGames,
  };
}

function clearAllFilters(state: FilterState): FilterState {
  return {
    ...state,
    selectedGenres: [],
    displayedGames: [...state.allGames],
  };
}

// Generators for property-based testing
const genreNameGenerator = fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,19}$/);

const genreGenerator = () =>
  fc.record({
    name: genreNameGenerator,
  });

const gameWithGenresGenerator = () =>
  fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    genres: fc.array(genreGenerator(), { minLength: 1, maxLength: 5 }),
  });

describe("GameFilters Property-Based Tests", () => {
  describe("Property 5: Genre Filter Accuracy", () => {
    it("filtered results should only include games that belong to the selected genre(s)", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 1, maxLength: 50 }),
          fc.array(genreNameGenerator, { minLength: 1, maxLength: 3 }),
          (games, selectedGenres) => {
            const results = filterGamesByGenres(games, selectedGenres);
            const lowerSelectedGenres = selectedGenres.map((g) => g.toLowerCase());

            // All results must have at least one of the selected genres
            return results.every((game) => {
              const gameGenres = game.genres.map((g) => g.name.toLowerCase());
              return lowerSelectedGenres.some((selected) => gameGenres.includes(selected));
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("single genre filter should return only games of that genre", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 5, maxLength: 30 }),
          (games) => {
            // Get a genre that exists in the games
            const allGenres = getAllGenres(games);
            if (allGenres.length === 0) return true;

            const selectedGenre = allGenres[0];
            const results = filterGamesByGenres(games, [selectedGenre]);

            // All results must have the selected genre
            return results.every((game) =>
              game.genres.some((g) => g.name.toLowerCase() === selectedGenre.toLowerCase())
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("multiple genre filters should return games matching ANY of the selected genres (OR logic)", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 5, maxLength: 30 }),
          (games) => {
            const allGenres = getAllGenres(games);
            if (allGenres.length < 2) return true;

            // Select two different genres
            const selectedGenres = [allGenres[0], allGenres[1]];
            const results = filterGamesByGenres(games, selectedGenres);

            // Results should include games with genre1 OR genre2
            const lowerSelected = selectedGenres.map((g) => g.toLowerCase());
            return results.every((game) => {
              const gameGenres = game.genres.map((g) => g.name.toLowerCase());
              return lowerSelected.some((selected) => gameGenres.includes(selected));
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("no genre filter should return all games", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 0, maxLength: 50 }),
          (games) => {
            const results = filterGamesByGenres(games, []);
            return results.length === games.length;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("genre filter should be case-insensitive", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 1, maxLength: 20 }),
          (games) => {
            const allGenres = getAllGenres(games);
            if (allGenres.length === 0) return true;

            const genre = allGenres[0];
            const lowerResults = filterGamesByGenres(games, [genre.toLowerCase()]);
            const upperResults = filterGamesByGenres(games, [genre.toUpperCase()]);
            const mixedResults = filterGamesByGenres(games, [genre]);

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
        { numRuns: 100 }
      );
    });

    it("filtering by non-existent genre should return empty result set", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 1, maxLength: 20 }),
          (games) => {
            // Use a genre that definitely won't exist
            const impossibleGenre = "ZZZZNONEXISTENTGENRE12345";
            const results = filterGamesByGenres(games, [impossibleGenre]);
            return results.length === 0;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Property 6: Genre Count Accuracy", () => {
    it("genre count should equal the actual number of games belonging to that genre", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 1, maxLength: 50 }),
          (games) => {
            const allGenres = getAllGenres(games);

            // For each genre, verify the count is accurate
            return allGenres.every((genre) => {
              const count = countGamesByGenre(games, genre);
              const actualGames = games.filter((game) =>
                game.genres.some((g) => g.name.toLowerCase() === genre.toLowerCase())
              );
              return count === actualGames.length;
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("genre count should be case-insensitive", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 1, maxLength: 30 }),
          (games) => {
            const allGenres = getAllGenres(games);
            if (allGenres.length === 0) return true;

            const genre = allGenres[0];
            const lowerCount = countGamesByGenre(games, genre.toLowerCase());
            const upperCount = countGamesByGenre(games, genre.toUpperCase());
            const mixedCount = countGamesByGenre(games, genre);

            return lowerCount === upperCount && upperCount === mixedCount;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("sum of genre counts may exceed total games (games can have multiple genres)", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 1, maxLength: 30 }),
          (games) => {
            const allGenres = getAllGenres(games);
            const totalGenreCounts = allGenres.reduce(
              (sum, genre) => sum + countGamesByGenre(games, genre),
              0
            );

            // Sum of genre counts >= total games (due to multi-genre games)
            return totalGenreCounts >= games.length || allGenres.length === 0;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("genre count for non-existent genre should be zero", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 0, maxLength: 30 }),
          (games) => {
            const impossibleGenre = "ZZZZNONEXISTENTGENRE12345";
            const count = countGamesByGenre(games, impossibleGenre);
            return count === 0;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("genre count should be non-negative", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 0, maxLength: 50 }),
          genreNameGenerator,
          (games, genre) => {
            const count = countGamesByGenre(games, genre);
            return count >= 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 7: Filter State Reset", () => {
    it("clearing all filters should restore display to show all available games", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 1, maxLength: 50 }),
          fc.array(genreNameGenerator, { minLength: 1, maxLength: 3 }),
          (games, selectedGenres) => {
            // Create initial state with all games
            const initialState = createFilterState(games);

            // Apply genre filter (may filter some games)
            const filteredState = applyGenreFilter(initialState, selectedGenres);

            // Clear all filters
            const clearedState = clearAllFilters(filteredState);

            // After clearing, all games should be displayed
            return (
              clearedState.displayedGames.length === games.length &&
              clearedState.selectedGenres.length === 0 &&
              games.every((game) => clearedState.displayedGames.some((g) => g.id === game.id))
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("filter state should be independent of previous filter selections", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 5, maxLength: 30 }),
          fc.array(fc.array(genreNameGenerator, { minLength: 1, maxLength: 2 }), {
            minLength: 2,
            maxLength: 5,
          }),
          (games, filterSequences) => {
            let state = createFilterState(games);

            // Apply multiple filter selections in sequence
            for (const genres of filterSequences) {
              state = applyGenreFilter(state, genres);
            }

            // Clear all filters
            state = clearAllFilters(state);

            // After clearing, state should be as if no filters were ever applied
            const freshState = createFilterState(games);
            return (
              state.displayedGames.length === freshState.displayedGames.length &&
              state.selectedGenres.length === freshState.selectedGenres.length
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it("clearing filters after filtering should restore original game count", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 10, maxLength: 50 }),
          (games) => {
            const initialState = createFilterState(games);
            const originalCount = initialState.displayedGames.length;

            // Apply a restrictive filter
            const filteredState = applyGenreFilter(initialState, ["ZZZZNONEXISTENTGENRE"]);

            // Clear filters
            const clearedState = clearAllFilters(filteredState);

            // Count should be restored
            return clearedState.displayedGames.length === originalCount;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("clearing empty filters should have no effect", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 1, maxLength: 30 }),
          (games) => {
            const initialState = createFilterState(games);

            // Clear without any filters applied
            const clearedState = clearAllFilters(initialState);

            // State should be unchanged
            return (
              clearedState.displayedGames.length === initialState.displayedGames.length &&
              clearedState.selectedGenres.length === initialState.selectedGenres.length
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it("applying same filter twice should yield same results", () => {
      fc.assert(
        fc.property(
          fc.array(gameWithGenresGenerator(), { minLength: 5, maxLength: 30 }),
          fc.array(genreNameGenerator, { minLength: 1, maxLength: 3 }),
          (games, selectedGenres) => {
            const state1 = createFilterState(games);
            const filtered1 = applyGenreFilter(state1, selectedGenres);

            const state2 = createFilterState(games);
            const filtered2 = applyGenreFilter(state2, selectedGenres);

            // Both should have the same results
            const ids1 = new Set(filtered1.displayedGames.map((g) => g.id));
            const ids2 = new Set(filtered2.displayedGames.map((g) => g.id));

            return ids1.size === ids2.size && [...ids1].every((id) => ids2.has(id));
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
