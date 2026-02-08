import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

/**
 * Feature: library-games-view
 * Property 2: Filter composition correctness
 * **Validates: Requirements 1.3, 1.4, 1.5, 4.3**
 *
 * For any combination of search query, genre filters, publisher filters, and library filter,
 * all returned games should satisfy ALL applied filter conditions simultaneously
 * (title matches search AND has selected genre AND has selected publisher AND is in library).
 */

// Types representing the domain
interface Game {
  id: string;
  slug: string;
  title: string;
  genres: string[];
  publisher: string;
}

interface LibraryEntry {
  userId: string;
  gameId: string;
}

interface FilterParams {
  searchQuery: string;
  selectedGenres: string[];
  selectedPublishers: string[];
  inLibrary: boolean;
  userId: string;
}

// Pure function that simulates the filter composition logic
function applyFilters(
  games: Game[],
  libraryEntries: LibraryEntry[],
  filters: FilterParams
): Game[] {
  let result = [...games];

  // Apply library filter first (if enabled)
  if (filters.inLibrary) {
    const userLibraryGameIds = new Set(
      libraryEntries.filter((entry) => entry.userId === filters.userId).map((entry) => entry.gameId)
    );
    result = result.filter((game) => userLibraryGameIds.has(game.id));
  }

  // Apply search filter (case-insensitive, word-by-word matching)
  if (filters.searchQuery.trim()) {
    const searchWords = filters.searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    result = result.filter((game) => {
      const titleLower = game.title.toLowerCase();
      return searchWords.every((word) => titleLower.includes(word));
    });
  }

  // Apply genre filter (game must have at least one of the selected genres)
  if (filters.selectedGenres.length > 0) {
    const selectedGenresLower = filters.selectedGenres.map((g) => g.toLowerCase());
    result = result.filter((game) => {
      const gameGenresLower = game.genres.map((g) => g.toLowerCase());
      return selectedGenresLower.some((genre) => gameGenresLower.includes(genre));
    });
  }

  // Apply publisher filter (game must have one of the selected publishers)
  if (filters.selectedPublishers.length > 0) {
    const selectedPublishersLower = filters.selectedPublishers.map((p) => p.toLowerCase());
    result = result.filter((game) =>
      selectedPublishersLower.includes(game.publisher.toLowerCase())
    );
  }

  return result;
}

// Helper to check if a game matches all filter conditions
function gameMatchesAllFilters(
  game: Game,
  libraryEntries: LibraryEntry[],
  filters: FilterParams
): boolean {
  // Check library membership
  if (filters.inLibrary) {
    const userLibraryGameIds = new Set(
      libraryEntries.filter((entry) => entry.userId === filters.userId).map((entry) => entry.gameId)
    );
    if (!userLibraryGameIds.has(game.id)) return false;
  }

  // Check search query
  if (filters.searchQuery.trim()) {
    const searchWords = filters.searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const titleLower = game.title.toLowerCase();
    if (!searchWords.every((word) => titleLower.includes(word))) return false;
  }

  // Check genre filter
  if (filters.selectedGenres.length > 0) {
    const selectedGenresLower = filters.selectedGenres.map((g) => g.toLowerCase());
    const gameGenresLower = game.genres.map((g) => g.toLowerCase());
    if (!selectedGenresLower.some((genre) => gameGenresLower.includes(genre))) return false;
  }

  // Check publisher filter
  if (filters.selectedPublishers.length > 0) {
    const selectedPublishersLower = filters.selectedPublishers.map((p) => p.toLowerCase());
    if (!selectedPublishersLower.includes(game.publisher.toLowerCase())) return false;
  }

  return true;
}

// Generators for property-based testing
const gameIdGenerator = fc.uuid();
const userIdGenerator = fc.uuid();
const slugGenerator = fc.stringMatching(/^[a-z0-9-]{3,30}$/);
const titleGenerator = fc.string({ minLength: 1, maxLength: 50 });
const genreGenerator = fc.constantFrom(
  "Action",
  "RPG",
  "Adventure",
  "Strategy",
  "Puzzle",
  "Sports"
);
const publisherGenerator = fc.constantFrom(
  "Nintendo",
  "Sony",
  "Microsoft",
  "Ubisoft",
  "EA",
  "Capcom"
);

const gameGenerator = fc.record({
  id: gameIdGenerator,
  slug: slugGenerator,
  title: titleGenerator,
  genres: fc.array(genreGenerator, { minLength: 1, maxLength: 3 }),
  publisher: publisherGenerator,
});

describe("Library Games API Property-Based Tests", () => {
  describe("Property 2: Filter composition correctness", () => {
    it("all returned games satisfy ALL applied filter conditions simultaneously", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 5, maxLength: 30 }),
          userIdGenerator,
          fc.string({ minLength: 0, maxLength: 20 }),
          fc.array(genreGenerator, { minLength: 0, maxLength: 2 }),
          fc.array(publisherGenerator, { minLength: 0, maxLength: 2 }),
          fc.boolean(),
          (games, userId, searchQuery, selectedGenres, selectedPublishers, inLibrary) => {
            // Create library entries (random subset of games)
            const libraryEntries: LibraryEntry[] = games
              .filter(() => Math.random() > 0.5)
              .map((game) => ({ userId, gameId: game.id }));

            const filters: FilterParams = {
              searchQuery,
              selectedGenres: [...new Set(selectedGenres)],
              selectedPublishers: [...new Set(selectedPublishers)],
              inLibrary,
              userId,
            };

            const filteredGames = applyFilters(games, libraryEntries, filters);

            // Property: Every returned game must satisfy ALL filter conditions
            for (const game of filteredGames) {
              expect(gameMatchesAllFilters(game, libraryEntries, filters)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("no game that matches all filters is excluded from results", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 5, maxLength: 30 }),
          userIdGenerator,
          fc.string({ minLength: 0, maxLength: 10 }),
          fc.array(genreGenerator, { minLength: 0, maxLength: 2 }),
          fc.array(publisherGenerator, { minLength: 0, maxLength: 2 }),
          fc.boolean(),
          (games, userId, searchQuery, selectedGenres, selectedPublishers, inLibrary) => {
            // Create library entries
            const libraryEntries: LibraryEntry[] = games
              .filter(() => Math.random() > 0.5)
              .map((game) => ({ userId, gameId: game.id }));

            const filters: FilterParams = {
              searchQuery,
              selectedGenres: [...new Set(selectedGenres)],
              selectedPublishers: [...new Set(selectedPublishers)],
              inLibrary,
              userId,
            };

            const filteredGames = applyFilters(games, libraryEntries, filters);
            const filteredGameIds = new Set(filteredGames.map((g) => g.id));

            // Property: Every game that matches all filters must be in the results
            for (const game of games) {
              if (gameMatchesAllFilters(game, libraryEntries, filters)) {
                expect(filteredGameIds.has(game.id)).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("search filter matches title case-insensitively with word-by-word matching", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 5, maxLength: 20 }),
          userIdGenerator,
          (games, userId) => {
            // Pick a game and create a search query from part of its title
            const targetGame = games[0];
            const titleWords = targetGame.title.split(/\s+/).filter(Boolean);
            const searchQuery =
              titleWords.length > 0 ? titleWords[0].toUpperCase() : targetGame.title.toUpperCase();

            // Add game to library
            const libraryEntries: LibraryEntry[] = [{ userId, gameId: targetGame.id }];

            const filters: FilterParams = {
              searchQuery,
              selectedGenres: [],
              selectedPublishers: [],
              inLibrary: true,
              userId,
            };

            const filteredGames = applyFilters(games, libraryEntries, filters);

            // Property: The target game should be in results if search matches (case-insensitive)
            const targetInResults = filteredGames.some((g) => g.id === targetGame.id);
            const searchLower = searchQuery.toLowerCase();
            const titleLower = targetGame.title.toLowerCase();
            const shouldMatch = titleLower.includes(searchLower);

            expect(targetInResults).toBe(shouldMatch);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("genre filter returns games with at least one matching genre", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 5, maxLength: 20 }),
          userIdGenerator,
          genreGenerator,
          (games, userId, selectedGenre) => {
            // Add all games to library
            const libraryEntries: LibraryEntry[] = games.map((game) => ({
              userId,
              gameId: game.id,
            }));

            const filters: FilterParams = {
              searchQuery: "",
              selectedGenres: [selectedGenre],
              selectedPublishers: [],
              inLibrary: true,
              userId,
            };

            const filteredGames = applyFilters(games, libraryEntries, filters);

            // Property: All returned games must have the selected genre
            for (const game of filteredGames) {
              const gameGenresLower = game.genres.map((g) => g.toLowerCase());
              expect(gameGenresLower.includes(selectedGenre.toLowerCase())).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("publisher filter returns only games from selected publishers", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 5, maxLength: 20 }),
          userIdGenerator,
          publisherGenerator,
          (games, userId, selectedPublisher) => {
            // Add all games to library
            const libraryEntries: LibraryEntry[] = games.map((game) => ({
              userId,
              gameId: game.id,
            }));

            const filters: FilterParams = {
              searchQuery: "",
              selectedGenres: [],
              selectedPublishers: [selectedPublisher],
              inLibrary: true,
              userId,
            };

            const filteredGames = applyFilters(games, libraryEntries, filters);

            // Property: All returned games must have the selected publisher
            for (const game of filteredGames) {
              expect(game.publisher.toLowerCase()).toBe(selectedPublisher.toLowerCase());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("combining all filters is equivalent to applying them sequentially", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 5, maxLength: 30 }),
          userIdGenerator,
          fc.string({ minLength: 0, maxLength: 10 }),
          fc.array(genreGenerator, { minLength: 0, maxLength: 2 }),
          fc.array(publisherGenerator, { minLength: 0, maxLength: 2 }),
          (games, userId, searchQuery, selectedGenres, selectedPublishers) => {
            // Create library entries
            const libraryEntries: LibraryEntry[] = games
              .filter(() => Math.random() > 0.3)
              .map((game) => ({ userId, gameId: game.id }));

            // Apply all filters at once
            const combinedFilters: FilterParams = {
              searchQuery,
              selectedGenres: [...new Set(selectedGenres)],
              selectedPublishers: [...new Set(selectedPublishers)],
              inLibrary: true,
              userId,
            };
            const combinedResult = applyFilters(games, libraryEntries, combinedFilters);

            // Apply filters sequentially
            let sequentialResult = [...games];

            // Step 1: Library filter
            const userLibraryGameIds = new Set(
              libraryEntries.filter((e) => e.userId === userId).map((e) => e.gameId)
            );
            sequentialResult = sequentialResult.filter((g) => userLibraryGameIds.has(g.id));

            // Step 2: Search filter
            if (searchQuery.trim()) {
              const searchWords = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
              sequentialResult = sequentialResult.filter((g) => {
                const titleLower = g.title.toLowerCase();
                return searchWords.every((word) => titleLower.includes(word));
              });
            }

            // Step 3: Genre filter
            const uniqueGenres = [...new Set(selectedGenres)];
            if (uniqueGenres.length > 0) {
              const genresLower = uniqueGenres.map((g) => g.toLowerCase());
              sequentialResult = sequentialResult.filter((g) => {
                const gameGenresLower = g.genres.map((genre) => genre.toLowerCase());
                return genresLower.some((genre) => gameGenresLower.includes(genre));
              });
            }

            // Step 4: Publisher filter
            const uniquePublishers = [...new Set(selectedPublishers)];
            if (uniquePublishers.length > 0) {
              const publishersLower = uniquePublishers.map((p) => p.toLowerCase());
              sequentialResult = sequentialResult.filter((g) =>
                publishersLower.includes(g.publisher.toLowerCase())
              );
            }

            // Property: Combined result should equal sequential result
            const combinedIds = new Set(combinedResult.map((g) => g.id));
            const sequentialIds = new Set(sequentialResult.map((g) => g.id));

            expect(combinedIds.size).toBe(sequentialIds.size);
            for (const id of combinedIds) {
              expect(sequentialIds.has(id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("empty filters return all library games when inLibrary=true", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 5, maxLength: 20 }),
          userIdGenerator,
          (games, userId) => {
            // Add some games to library
            const libraryEntries: LibraryEntry[] = games
              .slice(0, Math.ceil(games.length / 2))
              .map((game) => ({ userId, gameId: game.id }));

            const filters: FilterParams = {
              searchQuery: "",
              selectedGenres: [],
              selectedPublishers: [],
              inLibrary: true,
              userId,
            };

            const filteredGames = applyFilters(games, libraryEntries, filters);

            // Property: With no search/genre/publisher filters, should return all library games
            expect(filteredGames.length).toBe(libraryEntries.length);

            const libraryGameIds = new Set(libraryEntries.map((e) => e.gameId));
            for (const game of filteredGames) {
              expect(libraryGameIds.has(game.id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("filter order does not affect final results", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 5, maxLength: 20 }),
          userIdGenerator,
          fc.string({ minLength: 1, maxLength: 10 }),
          genreGenerator,
          publisherGenerator,
          (games, userId, searchQuery, genre, publisher) => {
            const libraryEntries: LibraryEntry[] = games.map((game) => ({
              userId,
              gameId: game.id,
            }));

            const filters: FilterParams = {
              searchQuery,
              selectedGenres: [genre],
              selectedPublishers: [publisher],
              inLibrary: true,
              userId,
            };

            // Apply filters in standard order
            const standardResult = applyFilters(games, libraryEntries, filters);

            // Apply filters in reverse order (manually)
            let reverseResult = [...games];

            // Publisher first
            reverseResult = reverseResult.filter(
              (g) => g.publisher.toLowerCase() === publisher.toLowerCase()
            );

            // Genre second
            reverseResult = reverseResult.filter((g) =>
              g.genres.map((gen) => gen.toLowerCase()).includes(genre.toLowerCase())
            );

            // Search third
            const searchWords = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
            reverseResult = reverseResult.filter((g) => {
              const titleLower = g.title.toLowerCase();
              return searchWords.every((word) => titleLower.includes(word));
            });

            // Library last
            const libraryGameIds = new Set(libraryEntries.map((e) => e.gameId));
            reverseResult = reverseResult.filter((g) => libraryGameIds.has(g.id));

            // Property: Results should be the same regardless of filter order
            const standardIds = new Set(standardResult.map((g) => g.id));
            const reverseIds = new Set(reverseResult.map((g) => g.id));

            expect(standardIds.size).toBe(reverseIds.size);
            for (const id of standardIds) {
              expect(reverseIds.has(id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
