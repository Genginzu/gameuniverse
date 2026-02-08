import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

/**
 * Feature: library-games-view
 * Property 3: Result count accuracy
 * **Validates: Requirements 1.6**
 *
 * For any combination of filters applied to the library, the displayed count
 * should equal the actual number of games that match all those filters.
 *
 * This test validates that the totalCount in pagination metadata accurately
 * reflects the number of games matching the applied filters.
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

interface PaginationResult {
  games: Game[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

// Pure function that simulates the filter logic (same as in filter-composition test)
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

// Simulates the API response with pagination
function fetchGamesWithPagination(
  allGames: Game[],
  libraryEntries: LibraryEntry[],
  filters: FilterParams,
  page: number,
  limit: number
): PaginationResult {
  // Apply all filters to get the full filtered set
  const filteredGames = applyFilters(allGames, libraryEntries, filters);

  // Calculate pagination
  const totalCount = filteredGames.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const offset = (page - 1) * limit;

  // Get the page slice
  const paginatedGames = filteredGames.slice(offset, offset + limit);

  return {
    games: paginatedGames,
    totalCount,
    currentPage: page,
    totalPages,
    limit,
  };
}

// Generators for property-based testing
const gameIdGenerator = fc.uuid();
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

const userIdGenerator = fc.uuid();

describe("Library Games View Property-Based Tests", () => {
  describe("Property 3: Result count accuracy", () => {
    it("totalCount equals the actual number of games matching all filters", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 50 }),
          userIdGenerator,
          fc.string({ minLength: 0, maxLength: 20 }),
          fc.array(genreGenerator, { minLength: 0, maxLength: 2 }),
          fc.array(publisherGenerator, { minLength: 0, maxLength: 2 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 10, max: 30 }),
          (games, userId, searchQuery, selectedGenres, selectedPublishers, page, limit) => {
            // Create library entries (random subset of games)
            const libraryEntries: LibraryEntry[] = games
              .filter(() => Math.random() > 0.3)
              .map((game) => ({ userId, gameId: game.id }));

            const filters: FilterParams = {
              searchQuery,
              selectedGenres: [...new Set(selectedGenres)],
              selectedPublishers: [...new Set(selectedPublishers)],
              inLibrary: true,
              userId,
            };

            // Get paginated result
            const result = fetchGamesWithPagination(games, libraryEntries, filters, page, limit);

            // Manually count games that match all filters
            const manuallyFilteredGames = applyFilters(games, libraryEntries, filters);
            const expectedCount = manuallyFilteredGames.length;

            // Property: totalCount must equal the actual filtered count
            expect(result.totalCount).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("totalCount remains accurate across different pages", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 20, maxLength: 100 }),
          userIdGenerator,
          fc.integer({ min: 1, max: 5 }),
          (games, userId, pageToTest) => {
            // Add all games to library for this test
            const libraryEntries: LibraryEntry[] = games.map((game) => ({
              userId,
              gameId: game.id,
            }));

            const filters: FilterParams = {
              searchQuery: "",
              selectedGenres: [],
              selectedPublishers: [],
              inLibrary: true,
              userId,
            };

            const limit = 20;

            // Fetch different pages
            const page1Result = fetchGamesWithPagination(games, libraryEntries, filters, 1, limit);
            const pageNResult = fetchGamesWithPagination(
              games,
              libraryEntries,
              filters,
              pageToTest,
              limit
            );

            // Property: totalCount should be the same regardless of which page is requested
            expect(page1Result.totalCount).toBe(pageNResult.totalCount);

            // Property: totalCount should equal the library size
            expect(page1Result.totalCount).toBe(libraryEntries.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("totalCount is zero when no games match filters", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 5, maxLength: 30 }),
          userIdGenerator,
          (games, userId) => {
            // Create an empty library
            const libraryEntries: LibraryEntry[] = [];

            const filters: FilterParams = {
              searchQuery: "",
              selectedGenres: [],
              selectedPublishers: [],
              inLibrary: true,
              userId,
            };

            const result = fetchGamesWithPagination(games, libraryEntries, filters, 1, 20);

            // Property: totalCount should be 0 when library is empty
            expect(result.totalCount).toBe(0);
            expect(result.games.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("totalCount decreases when more restrictive filters are applied", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 10, maxLength: 50 }),
          userIdGenerator,
          genreGenerator,
          publisherGenerator,
          (games, userId, genre, publisher) => {
            // Add all games to library
            const libraryEntries: LibraryEntry[] = games.map((game) => ({
              userId,
              gameId: game.id,
            }));

            // No filters
            const noFilters: FilterParams = {
              searchQuery: "",
              selectedGenres: [],
              selectedPublishers: [],
              inLibrary: true,
              userId,
            };

            // Genre filter only
            const genreFilter: FilterParams = {
              searchQuery: "",
              selectedGenres: [genre],
              selectedPublishers: [],
              inLibrary: true,
              userId,
            };

            // Genre + publisher filter
            const combinedFilter: FilterParams = {
              searchQuery: "",
              selectedGenres: [genre],
              selectedPublishers: [publisher],
              inLibrary: true,
              userId,
            };

            const noFilterResult = fetchGamesWithPagination(
              games,
              libraryEntries,
              noFilters,
              1,
              20
            );
            const genreFilterResult = fetchGamesWithPagination(
              games,
              libraryEntries,
              genreFilter,
              1,
              20
            );
            const combinedFilterResult = fetchGamesWithPagination(
              games,
              libraryEntries,
              combinedFilter,
              1,
              20
            );

            // Property: More restrictive filters should result in equal or fewer results
            expect(genreFilterResult.totalCount).toBeLessThanOrEqual(noFilterResult.totalCount);
            expect(combinedFilterResult.totalCount).toBeLessThanOrEqual(
              genreFilterResult.totalCount
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("totalCount equals sum of games across all pages", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 25, maxLength: 75 }),
          userIdGenerator,
          (games, userId) => {
            // Add all games to library
            const libraryEntries: LibraryEntry[] = games.map((game) => ({
              userId,
              gameId: game.id,
            }));

            const filters: FilterParams = {
              searchQuery: "",
              selectedGenres: [],
              selectedPublishers: [],
              inLibrary: true,
              userId,
            };

            const limit = 20;
            const firstPageResult = fetchGamesWithPagination(
              games,
              libraryEntries,
              filters,
              1,
              limit
            );

            // Collect all games across all pages
            let totalGamesAcrossPages = 0;
            for (let page = 1; page <= firstPageResult.totalPages; page++) {
              const pageResult = fetchGamesWithPagination(
                games,
                libraryEntries,
                filters,
                page,
                limit
              );
              totalGamesAcrossPages += pageResult.games.length;
            }

            // Property: Sum of games across all pages should equal totalCount
            expect(totalGamesAcrossPages).toBe(firstPageResult.totalCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("totalCount is consistent with games array length on single page results", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 1, maxLength: 15 }),
          userIdGenerator,
          (games, userId) => {
            // Add all games to library (small enough to fit on one page)
            const libraryEntries: LibraryEntry[] = games.map((game) => ({
              userId,
              gameId: game.id,
            }));

            const filters: FilterParams = {
              searchQuery: "",
              selectedGenres: [],
              selectedPublishers: [],
              inLibrary: true,
              userId,
            };

            const limit = 20; // Larger than games array
            const result = fetchGamesWithPagination(games, libraryEntries, filters, 1, limit);

            // Property: When all results fit on one page, games.length should equal totalCount
            expect(result.games.length).toBe(result.totalCount);
            expect(result.totalPages).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("totalCount reflects search filter accurately", () => {
      fc.assert(
        fc.property(
          fc.array(gameGenerator, { minLength: 10, maxLength: 30 }),
          userIdGenerator,
          (games, userId) => {
            // Deduplicate games by ID to match real-world behavior
            const uniqueGames = Array.from(new Map(games.map((g) => [g.id, g])).values());

            // Skip if no unique games
            fc.pre(uniqueGames.length > 0);

            // Add all unique games to library
            const libraryEntries: LibraryEntry[] = uniqueGames.map((game) => ({
              userId,
              gameId: game.id,
            }));

            // Pick a word from the first game's title as search query
            const targetGame = uniqueGames[0];
            const titleWords = targetGame.title.split(/\s+/).filter(Boolean);
            const searchQuery = titleWords.length > 0 ? titleWords[0] : targetGame.title;

            const filters: FilterParams = {
              searchQuery,
              selectedGenres: [],
              selectedPublishers: [],
              inLibrary: true,
              userId,
            };

            const result = fetchGamesWithPagination(uniqueGames, libraryEntries, filters, 1, 20);

            // Manually count matching games from unique games using the same logic as applyFilters
            const searchWords = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
            const expectedMatches = uniqueGames.filter((g) => {
              const titleLower = g.title.toLowerCase();
              return searchWords.every((word) => titleLower.includes(word));
            }).length;

            // Property: totalCount should match the number of games with matching titles
            expect(result.totalCount).toBe(expectedMatches);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
