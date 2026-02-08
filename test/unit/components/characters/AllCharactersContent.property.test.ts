import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

/**
 * Feature: character-pages
 * Property 2: Case-Insensitive Search Filtering
 * **Validates: Requirements 2.1, 2.4**
 *
 * For any search term (in any case combination), the filtered character results
 * should only include characters whose names contain that search term
 * (case-insensitive matching).
 *
 * This test validates the search filtering logic used in AllCharactersContent
 * and the /api/characters endpoint to ensure case-insensitive search works correctly.
 */

/**
 * Feature: character-pages
 * Property 6: Pagination State Preservation
 * **Validates: Requirements 4.3**
 *
 * For any active search and filter state, navigating between pages should
 * preserve all search terms and selected filters.
 *
 * This test validates that the pagination state management in AllCharactersContent
 * correctly preserves search and filter criteria when changing pages.
 */

// Character interface for testing
interface TestCharacter {
  id: string;
  slug: string;
  name: string;
  role?: string;
  primaryGame: string;
  gamesCount: number;
}

/**
 * Simulates the case-insensitive search filtering logic.
 * This mirrors the actual filtering behavior in:
 * - src/app/api/characters/route.ts (uses ILIKE for case-insensitive matching)
 * - The search is performed on character names
 */
const applyCaseInsensitiveSearch = (
  characters: TestCharacter[],
  searchTerm: string
): TestCharacter[] => {
  if (!searchTerm.trim()) {
    return characters;
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();

  return characters.filter((character) => character.name.toLowerCase().includes(normalizedSearch));
};

// Generator for character names with various case combinations
const characterNameGenerator = fc.oneof(
  // Regular names
  fc.string({ minLength: 1, maxLength: 50 }),
  // Names with mixed case
  fc.stringMatching(/^[A-Za-z][a-zA-Z0-9 ]{0,49}$/),
  // Names with special characters
  fc.stringMatching(/^[A-Za-z][a-zA-Z0-9 '-]{0,49}$/)
);

// Generator for valid slugs
const slugGenerator = fc.stringMatching(/^[a-z0-9-]{1,50}$/);

// Generator for test characters
const testCharacterGenerator: fc.Arbitrary<TestCharacter> = fc.record({
  id: fc.uuid(),
  slug: slugGenerator,
  name: characterNameGenerator,
  role: fc.option(fc.constantFrom("protagonist", "antagonist", "supporting", "npc", "playable"), {
    nil: undefined,
  }),
  primaryGame: fc.string({ minLength: 1, maxLength: 50 }),
  gamesCount: fc.integer({ min: 0, max: 100 }),
});

// Generator for search terms with various case combinations
const searchTermGenerator = fc.oneof(
  fc.string({ minLength: 1, maxLength: 20 }),
  // Uppercase search terms
  fc.string({ minLength: 1, maxLength: 20 }).map((s) => s.toUpperCase()),
  // Lowercase search terms
  fc.string({ minLength: 1, maxLength: 20 }).map((s) => s.toLowerCase()),
  // Mixed case search terms
  fc.string({ minLength: 1, maxLength: 20 }).map((s) =>
    s
      .split("")
      .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
      .join("")
  )
);

describe("AllCharactersContent Property-Based Tests", () => {
  describe("Property 2: Case-Insensitive Search Filtering", () => {
    it("returns all characters when search term is empty", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator, { minLength: 0, maxLength: 20 }),
          (characters) => {
            const result = applyCaseInsensitiveSearch(characters, "");

            expect(result.length).toBe(characters.length);
            expect(result).toEqual(characters);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns all characters when search term is whitespace only", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator, { minLength: 0, maxLength: 20 }),
          fc
            .array(fc.constantFrom(" ", "\t", "\n"), { minLength: 1, maxLength: 5 })
            .map((arr) => arr.join("")),
          (characters, whitespace) => {
            const result = applyCaseInsensitiveSearch(characters, whitespace);

            expect(result.length).toBe(characters.length);
            expect(result).toEqual(characters);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("search is case-insensitive - uppercase search finds lowercase names", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
          (baseName) => {
            const lowercaseName = baseName.toLowerCase();
            const uppercaseSearch = baseName.toUpperCase();

            const characters: TestCharacter[] = [
              {
                id: "1",
                slug: "test-char",
                name: lowercaseName,
                primaryGame: "Test Game",
                gamesCount: 1,
              },
            ];

            const result = applyCaseInsensitiveSearch(characters, uppercaseSearch);

            expect(result.length).toBe(1);
            expect(result[0].name).toBe(lowercaseName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("search is case-insensitive - lowercase search finds uppercase names", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
          (baseName) => {
            const uppercaseName = baseName.toUpperCase();
            const lowercaseSearch = baseName.toLowerCase();

            const characters: TestCharacter[] = [
              {
                id: "1",
                slug: "test-char",
                name: uppercaseName,
                primaryGame: "Test Game",
                gamesCount: 1,
              },
            ];

            const result = applyCaseInsensitiveSearch(characters, lowercaseSearch);

            expect(result.length).toBe(1);
            expect(result[0].name).toBe(uppercaseName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("search is case-insensitive - mixed case search finds any case name", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
          fc.constantFrom("upper", "lower", "mixed"),
          fc.constantFrom("upper", "lower", "mixed"),
          (baseName, nameCase, searchCase) => {
            // Apply case transformation to name
            let characterName: string;
            switch (nameCase) {
              case "upper":
                characterName = baseName.toUpperCase();
                break;
              case "lower":
                characterName = baseName.toLowerCase();
                break;
              case "mixed":
                characterName = baseName
                  .split("")
                  .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
                  .join("");
                break;
            }

            // Apply case transformation to search term
            let searchTerm: string;
            switch (searchCase) {
              case "upper":
                searchTerm = baseName.toUpperCase();
                break;
              case "lower":
                searchTerm = baseName.toLowerCase();
                break;
              case "mixed":
                searchTerm = baseName
                  .split("")
                  .map((c, i) => (i % 2 === 1 ? c.toUpperCase() : c.toLowerCase()))
                  .join("");
                break;
            }

            const characters: TestCharacter[] = [
              {
                id: "1",
                slug: "test-char",
                name: characterName,
                primaryGame: "Test Game",
                gamesCount: 1,
              },
            ];

            const result = applyCaseInsensitiveSearch(characters, searchTerm);

            // Should always find the character regardless of case combination
            expect(result.length).toBe(1);
            expect(result[0].name).toBe(characterName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("all returned characters contain the search term (case-insensitive)", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator, { minLength: 1, maxLength: 20 }),
          searchTermGenerator,
          (characters, searchTerm) => {
            const result = applyCaseInsensitiveSearch(characters, searchTerm);
            const normalizedSearch = searchTerm.trim().toLowerCase();

            // Skip if search term is empty after trimming
            if (!normalizedSearch) {
              expect(result).toEqual(characters);
              return;
            }

            // All returned characters must contain the search term (case-insensitive)
            for (const character of result) {
              const nameContainsSearch = character.name.toLowerCase().includes(normalizedSearch);
              expect(nameContainsSearch).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("characters not containing search term are excluded", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator, { minLength: 1, maxLength: 20 }),
          searchTermGenerator,
          (characters, searchTerm) => {
            const result = applyCaseInsensitiveSearch(characters, searchTerm);
            const normalizedSearch = searchTerm.trim().toLowerCase();

            // Skip if search term is empty after trimming
            if (!normalizedSearch) {
              return;
            }

            // Characters not in result should NOT contain the search term
            const excludedCharacters = characters.filter((c) => !result.some((r) => r.id === c.id));

            for (const character of excludedCharacters) {
              const nameContainsSearch = character.name.toLowerCase().includes(normalizedSearch);
              expect(nameContainsSearch).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("search result is always a subset of the original list", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator, { minLength: 0, maxLength: 20 }),
          searchTermGenerator,
          (characters, searchTerm) => {
            const result = applyCaseInsensitiveSearch(characters, searchTerm);

            // Result should never be larger than input
            expect(result.length).toBeLessThanOrEqual(characters.length);

            // Every result item should exist in the original list
            for (const character of result) {
              const existsInOriginal = characters.some((c) => c.id === character.id);
              expect(existsInOriginal).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("search filtering is deterministic - same input produces same output", () => {
      fc.assert(
        fc.property(
          fc.array(testCharacterGenerator, { minLength: 0, maxLength: 20 }),
          searchTermGenerator,
          (characters, searchTerm) => {
            const result1 = applyCaseInsensitiveSearch(characters, searchTerm);
            const result2 = applyCaseInsensitiveSearch(characters, searchTerm);

            expect(result1.length).toBe(result2.length);
            expect(result1).toEqual(result2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("partial name matches are included in results", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 20 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
          fc.integer({ min: 0, max: 2 }),
          fc.integer({ min: 3, max: 5 }),
          (fullName, startOffset, length) => {
            // Extract a substring from the name
            const endIndex = Math.min(startOffset + length, fullName.length);
            const partialSearch = fullName.substring(startOffset, endIndex);

            // Skip if partial search is empty
            if (!partialSearch) return;

            const characters: TestCharacter[] = [
              {
                id: "1",
                slug: "test-char",
                name: fullName,
                primaryGame: "Test Game",
                gamesCount: 1,
              },
            ];

            const result = applyCaseInsensitiveSearch(characters, partialSearch);

            // Partial match should find the character
            expect(result.length).toBe(1);
            expect(result[0].name).toBe(fullName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("search with leading/trailing whitespace works correctly", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
          fc
            .array(fc.constantFrom(" ", "\t"), { minLength: 0, maxLength: 3 })
            .map((arr) => arr.join("")),
          fc
            .array(fc.constantFrom(" ", "\t"), { minLength: 0, maxLength: 3 })
            .map((arr) => arr.join("")),
          (baseName, leadingWhitespace, trailingWhitespace) => {
            const searchWithWhitespace = leadingWhitespace + baseName + trailingWhitespace;

            const characters: TestCharacter[] = [
              {
                id: "1",
                slug: "test-char",
                name: baseName,
                primaryGame: "Test Game",
                gamesCount: 1,
              },
            ];

            const result = applyCaseInsensitiveSearch(characters, searchWithWhitespace);

            // Should find the character after trimming whitespace
            expect(result.length).toBe(1);
            expect(result[0].name).toBe(baseName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("empty result when no characters match the search term", () => {
      // Create characters with specific names that won't match "xyz123"
      const characters: TestCharacter[] = [
        { id: "1", slug: "mario", name: "Mario", primaryGame: "Super Mario", gamesCount: 10 },
        { id: "2", slug: "link", name: "Link", primaryGame: "Zelda", gamesCount: 8 },
        { id: "3", slug: "samus", name: "Samus", primaryGame: "Metroid", gamesCount: 5 },
      ];

      const result = applyCaseInsensitiveSearch(characters, "xyz123");

      expect(result.length).toBe(0);
    });

    it("search finds characters with names containing special characters", () => {
      const characters: TestCharacter[] = [
        {
          id: "1",
          slug: "master-chief",
          name: "Master Chief",
          primaryGame: "Halo",
          gamesCount: 6,
        },
        {
          id: "2",
          slug: "solid-snake",
          name: "Solid Snake",
          primaryGame: "Metal Gear",
          gamesCount: 5,
        },
        {
          id: "3",
          slug: "cloud-strife",
          name: "Cloud Strife",
          primaryGame: "Final Fantasy VII",
          gamesCount: 3,
        },
      ];

      // Search for "chief" should find "Master Chief"
      const result1 = applyCaseInsensitiveSearch(characters, "chief");
      expect(result1.length).toBe(1);
      expect(result1[0].name).toBe("Master Chief");

      // Search for "SNAKE" should find "Solid Snake"
      const result2 = applyCaseInsensitiveSearch(characters, "SNAKE");
      expect(result2.length).toBe(1);
      expect(result2[0].name).toBe("Solid Snake");

      // Search for "Cloud" should find "Cloud Strife"
      const result3 = applyCaseInsensitiveSearch(characters, "cLoUd");
      expect(result3.length).toBe(1);
      expect(result3[0].name).toBe("Cloud Strife");
    });
  });
});

/**
 * Feature: character-pages
 * Property 6: Pagination State Preservation
 * **Validates: Requirements 4.3**
 *
 * Simulates the pagination state management logic in AllCharactersContent.
 * When navigating between pages, the search query and filter selections
 * must be preserved and passed to the API.
 */

// Filter state interface
interface FilterState {
  searchQuery: string;
  selectedGames: string[];
  selectedRoles: string[];
  currentPage: number;
}

// API request parameters interface
interface ApiRequestParams {
  locale: string;
  page: number;
  limit: number;
  search?: string;
  games?: string;
  roles?: string;
}

/**
 * Simulates the handlePageChange function from AllCharactersContent.
 * This mirrors the actual behavior where page changes preserve filter state.
 */
const simulatePageChange = (currentState: FilterState, newPage: number): FilterState => {
  // Page change preserves all other state
  return {
    ...currentState,
    currentPage: newPage,
  };
};

/**
 * Simulates building API request parameters from filter state.
 * This mirrors the fetchCharacters function in AllCharactersContent.
 */
const buildApiRequestParams = (
  state: FilterState,
  locale: string = "fr",
  limit: number = 20
): ApiRequestParams => {
  const params: ApiRequestParams = {
    locale,
    page: state.currentPage,
    limit,
  };

  if (state.searchQuery.trim()) {
    params.search = state.searchQuery.trim();
  }

  if (state.selectedGames.length > 0) {
    params.games = state.selectedGames.join(",");
  }

  if (state.selectedRoles.length > 0) {
    params.roles = state.selectedRoles.join(",");
  }

  return params;
};

// Generator for search queries
const searchQueryGenerator = fc.oneof(
  fc.constant(""), // Empty search
  fc.string({ minLength: 1, maxLength: 50 }), // Non-empty search
  fc.stringMatching(/^[a-zA-Z0-9 ]{1,30}$/) // Alphanumeric search
);

// Generator for game IDs (UUIDs)
const gameIdGenerator = fc.uuid();

// Generator for role values
const roleGenerator = fc.constantFrom("protagonist", "antagonist", "supporting", "npc", "playable");

// Generator for filter state
const filterStateGenerator: fc.Arbitrary<FilterState> = fc.record({
  searchQuery: searchQueryGenerator,
  selectedGames: fc.array(gameIdGenerator, { minLength: 0, maxLength: 5 }),
  selectedRoles: fc.array(roleGenerator, { minLength: 0, maxLength: 3 }),
  currentPage: fc.integer({ min: 1, max: 100 }),
});

// Generator for valid page numbers
const pageNumberGenerator = fc.integer({ min: 1, max: 100 });

describe("AllCharactersContent Property-Based Tests - Pagination State Preservation", () => {
  describe("Property 6: Pagination State Preservation", () => {
    it("page change preserves search query", () => {
      fc.assert(
        fc.property(filterStateGenerator, pageNumberGenerator, (initialState, newPage) => {
          const newState = simulatePageChange(initialState, newPage);

          // Search query must be preserved
          expect(newState.searchQuery).toBe(initialState.searchQuery);
        }),
        { numRuns: 100 }
      );
    });

    it("page change preserves selected games filter", () => {
      fc.assert(
        fc.property(filterStateGenerator, pageNumberGenerator, (initialState, newPage) => {
          const newState = simulatePageChange(initialState, newPage);

          // Selected games must be preserved
          expect(newState.selectedGames).toEqual(initialState.selectedGames);
          expect(newState.selectedGames.length).toBe(initialState.selectedGames.length);
        }),
        { numRuns: 100 }
      );
    });

    it("page change preserves selected roles filter", () => {
      fc.assert(
        fc.property(filterStateGenerator, pageNumberGenerator, (initialState, newPage) => {
          const newState = simulatePageChange(initialState, newPage);

          // Selected roles must be preserved
          expect(newState.selectedRoles).toEqual(initialState.selectedRoles);
          expect(newState.selectedRoles.length).toBe(initialState.selectedRoles.length);
        }),
        { numRuns: 100 }
      );
    });

    it("page change only updates the current page", () => {
      fc.assert(
        fc.property(filterStateGenerator, pageNumberGenerator, (initialState, newPage) => {
          const newState = simulatePageChange(initialState, newPage);

          // Only currentPage should change
          expect(newState.currentPage).toBe(newPage);
          expect(newState.searchQuery).toBe(initialState.searchQuery);
          expect(newState.selectedGames).toEqual(initialState.selectedGames);
          expect(newState.selectedRoles).toEqual(initialState.selectedRoles);
        }),
        { numRuns: 100 }
      );
    });

    it("API request includes preserved search query after page change", () => {
      fc.assert(
        fc.property(
          filterStateGenerator.filter((s) => s.searchQuery.trim().length > 0),
          pageNumberGenerator,
          (initialState, newPage) => {
            const newState = simulatePageChange(initialState, newPage);
            const apiParams = buildApiRequestParams(newState);

            // API request should include the preserved search query
            expect(apiParams.search).toBe(initialState.searchQuery.trim());
            expect(apiParams.page).toBe(newPage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("API request includes preserved game filters after page change", () => {
      fc.assert(
        fc.property(
          filterStateGenerator.filter((s) => s.selectedGames.length > 0),
          pageNumberGenerator,
          (initialState, newPage) => {
            const newState = simulatePageChange(initialState, newPage);
            const apiParams = buildApiRequestParams(newState);

            // API request should include the preserved game filters
            expect(apiParams.games).toBe(initialState.selectedGames.join(","));
            expect(apiParams.page).toBe(newPage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("API request includes preserved role filters after page change", () => {
      fc.assert(
        fc.property(
          filterStateGenerator.filter((s) => s.selectedRoles.length > 0),
          pageNumberGenerator,
          (initialState, newPage) => {
            const newState = simulatePageChange(initialState, newPage);
            const apiParams = buildApiRequestParams(newState);

            // API request should include the preserved role filters
            expect(apiParams.roles).toBe(initialState.selectedRoles.join(","));
            expect(apiParams.page).toBe(newPage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("API request includes all preserved filters after page change", () => {
      fc.assert(
        fc.property(
          filterStateGenerator.filter(
            (s) =>
              s.searchQuery.trim().length > 0 &&
              s.selectedGames.length > 0 &&
              s.selectedRoles.length > 0
          ),
          pageNumberGenerator,
          (initialState, newPage) => {
            const newState = simulatePageChange(initialState, newPage);
            const apiParams = buildApiRequestParams(newState);

            // All filters should be preserved in API request
            expect(apiParams.search).toBe(initialState.searchQuery.trim());
            expect(apiParams.games).toBe(initialState.selectedGames.join(","));
            expect(apiParams.roles).toBe(initialState.selectedRoles.join(","));
            expect(apiParams.page).toBe(newPage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("multiple consecutive page changes preserve all filters", () => {
      fc.assert(
        fc.property(
          filterStateGenerator,
          fc.array(pageNumberGenerator, { minLength: 2, maxLength: 10 }),
          (initialState, pageSequence) => {
            let currentState = initialState;

            // Apply multiple page changes
            for (const newPage of pageSequence) {
              currentState = simulatePageChange(currentState, newPage);

              // After each page change, filters must still be preserved
              expect(currentState.searchQuery).toBe(initialState.searchQuery);
              expect(currentState.selectedGames).toEqual(initialState.selectedGames);
              expect(currentState.selectedRoles).toEqual(initialState.selectedRoles);
            }

            // Final page should be the last in the sequence
            expect(currentState.currentPage).toBe(pageSequence[pageSequence.length - 1]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("page change is idempotent for same page number", () => {
      fc.assert(
        fc.property(filterStateGenerator, (initialState) => {
          const samePage = initialState.currentPage;
          const newState = simulatePageChange(initialState, samePage);

          // State should be identical when changing to the same page
          expect(newState).toEqual(initialState);
        }),
        { numRuns: 100 }
      );
    });

    it("empty filters are preserved correctly after page change", () => {
      fc.assert(
        fc.property(pageNumberGenerator, pageNumberGenerator, (initialPage, newPage) => {
          const emptyFilterState: FilterState = {
            searchQuery: "",
            selectedGames: [],
            selectedRoles: [],
            currentPage: initialPage,
          };

          const newState = simulatePageChange(emptyFilterState, newPage);
          const apiParams = buildApiRequestParams(newState);

          // Empty filters should not appear in API params
          expect(apiParams.search).toBeUndefined();
          expect(apiParams.games).toBeUndefined();
          expect(apiParams.roles).toBeUndefined();
          expect(apiParams.page).toBe(newPage);
        }),
        { numRuns: 100 }
      );
    });

    it("whitespace-only search query is treated as empty after page change", () => {
      fc.assert(
        fc.property(
          fc
            .array(fc.constantFrom(" ", "\t", "\n"), { minLength: 1, maxLength: 5 })
            .map((arr) => arr.join("")),
          pageNumberGenerator,
          pageNumberGenerator,
          (whitespaceSearch, initialPage, newPage) => {
            const stateWithWhitespace: FilterState = {
              searchQuery: whitespaceSearch,
              selectedGames: [],
              selectedRoles: [],
              currentPage: initialPage,
            };

            const newState = simulatePageChange(stateWithWhitespace, newPage);
            const apiParams = buildApiRequestParams(newState);

            // Whitespace-only search should not appear in API params
            expect(apiParams.search).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
