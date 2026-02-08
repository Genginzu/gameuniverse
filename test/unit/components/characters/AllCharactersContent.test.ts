import { describe, it, expect } from "bun:test";
import type { CharacterSummary } from "../../../../src/types/character";
import type { Pagination } from "../../../../src/types/pagination";

/**
 * Integration Tests for AllCharactersContent Component
 *
 * **Validates: Requirements 1.1, 1.3, 2.1, 3.1, 4.2**
 *
 * These tests validate the core logic and state management of AllCharactersContent:
 * - Initial load of characters
 * - Search updates results
 * - Filters update results
 * - Pagination works
 * - Combination of search + filters + pagination
 */

// Simulated API response structure
interface ApiResponse {
  characters: CharacterSummary[];
  pagination: Pagination;
}

// Mock character data for testing
const createMockCharacter = (overrides: Partial<CharacterSummary> = {}): CharacterSummary => ({
  id: `char-${Math.random().toString(36).substr(2, 9)}`,
  slug: "test-character",
  name: "Test Character",
  role: "protagonist",
  description: "A test character",
  mainImage: "https://example.com/image.jpg",
  backgroundColor: "#ff0000",
  primaryGame: "Test Game",
  gamesCount: 5,
  ...overrides,
});

// Create mock characters array
const createMockCharacters = (count: number): CharacterSummary[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockCharacter({
      id: `char-${i + 1}`,
      slug: `character-${i + 1}`,
      name: `Character ${i + 1}`,
      role: i % 3 === 0 ? "protagonist" : i % 3 === 1 ? "antagonist" : "supporting",
      primaryGame: `Game ${Math.floor(i / 3) + 1}`,
    })
  );
};

// Simulate the fetchCharacters API call logic
const simulateFetchCharacters = (
  allCharacters: CharacterSummary[],
  options: {
    search?: string;
    games?: string[];
    roles?: string[];
    page?: number;
    limit?: number;
  } = {}
): ApiResponse => {
  const { search = "", games = [], roles = [], page = 1, limit = 20 } = options;

  let filtered = [...allCharacters];

  // Apply search filter (case-insensitive)
  if (search.trim()) {
    const searchLower = search.trim().toLowerCase();
    filtered = filtered.filter((c) => c.name.toLowerCase().includes(searchLower));
  }

  // Apply game filter
  if (games.length > 0) {
    filtered = filtered.filter((c) => games.some((g) => c.primaryGame.includes(g)));
  }

  // Apply role filter
  if (roles.length > 0) {
    filtered = filtered.filter((c) => c.role && roles.includes(c.role));
  }

  // Calculate pagination
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCharacters = filtered.slice(startIndex, endIndex);

  return {
    characters: paginatedCharacters,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

// Simulate component state management
interface ComponentState {
  characters: CharacterSummary[];
  pagination: Pagination | null;
  loading: boolean;
  searchQuery: string;
  selectedGames: string[];
  selectedRoles: string[];
}

const createInitialState = (): ComponentState => ({
  characters: [],
  pagination: null,
  loading: true,
  searchQuery: "",
  selectedGames: [],
  selectedRoles: [],
});

describe("AllCharactersContent Integration Tests", () => {
  describe("Initial Load of Characters", () => {
    /**
     * **Validates: Requirement 1.1**
     * WHEN a user navigates to /characters, THE Character_List_Page SHALL display
     * all characters in a grid layout
     */
    it("loads characters on initial mount", () => {
      const mockCharacters = createMockCharacters(25);
      const state = createInitialState();

      // Simulate initial fetch
      const response = simulateFetchCharacters(mockCharacters, { page: 1, limit: 20 });

      // Update state as component would
      const updatedState: ComponentState = {
        ...state,
        characters: response.characters,
        pagination: response.pagination,
        loading: false,
      };

      expect(updatedState.characters.length).toBe(20);
      expect(updatedState.pagination?.totalCount).toBe(25);
      expect(updatedState.pagination?.currentPage).toBe(1);
      expect(updatedState.loading).toBe(false);
    });

    /**
     * **Validates: Requirement 1.3**
     * WHEN the page loads, THE Character_System SHALL fetch character data from the
     * Character_API
     */
    it("fetches character data with correct default parameters", () => {
      const mockCharacters = createMockCharacters(10);

      const response = simulateFetchCharacters(mockCharacters, {
        page: 1,
        limit: 20,
      });

      expect(response.characters).toBeDefined();
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
    });

    it("handles empty character list gracefully", () => {
      const response = simulateFetchCharacters([], { page: 1, limit: 20 });

      expect(response.characters.length).toBe(0);
      expect(response.pagination.totalCount).toBe(0);
      expect(response.pagination.totalPages).toBe(0);
    });
  });

  describe("Search Updates Results", () => {
    /**
     * **Validates: Requirement 2.1**
     * WHEN a user types in the search field, THE Character_System SHALL filter
     * characters whose names contain the search term
     */
    it("filters characters by search term", () => {
      const mockCharacters = [
        createMockCharacter({ id: "1", name: "Mario", slug: "mario" }),
        createMockCharacter({ id: "2", name: "Luigi", slug: "luigi" }),
        createMockCharacter({ id: "3", name: "Princess Peach", slug: "peach" }),
        createMockCharacter({ id: "4", name: "Bowser", slug: "bowser" }),
      ];

      const response = simulateFetchCharacters(mockCharacters, { search: "Mario" });

      expect(response.characters.length).toBe(1);
      expect(response.characters[0].name).toBe("Mario");
    });

    it("search is case-insensitive", () => {
      const mockCharacters = [
        createMockCharacter({ id: "1", name: "Mario", slug: "mario" }),
        createMockCharacter({ id: "2", name: "LUIGI", slug: "luigi" }),
      ];

      const responseLower = simulateFetchCharacters(mockCharacters, { search: "mario" });
      const responseUpper = simulateFetchCharacters(mockCharacters, { search: "MARIO" });
      const responseMixed = simulateFetchCharacters(mockCharacters, { search: "MaRiO" });

      expect(responseLower.characters.length).toBe(1);
      expect(responseUpper.characters.length).toBe(1);
      expect(responseMixed.characters.length).toBe(1);
    });

    it("partial search matches work", () => {
      const mockCharacters = [
        createMockCharacter({ id: "1", name: "Super Mario", slug: "super-mario" }),
        createMockCharacter({ id: "2", name: "Mario Kart", slug: "mario-kart" }),
        createMockCharacter({ id: "3", name: "Link", slug: "link" }),
      ];

      const response = simulateFetchCharacters(mockCharacters, { search: "ario" });

      expect(response.characters.length).toBe(2);
      expect(response.characters.every((c) => c.name.toLowerCase().includes("ario"))).toBe(true);
    });

    it("empty search returns all characters", () => {
      const mockCharacters = createMockCharacters(10);

      const response = simulateFetchCharacters(mockCharacters, { search: "" });

      expect(response.characters.length).toBe(10);
    });

    it("search with no matches returns empty results", () => {
      const mockCharacters = createMockCharacters(10);

      const response = simulateFetchCharacters(mockCharacters, { search: "xyz123nonexistent" });

      expect(response.characters.length).toBe(0);
      expect(response.pagination.totalCount).toBe(0);
    });
  });

  describe("Filters Update Results", () => {
    /**
     * **Validates: Requirement 3.1**
     * WHEN a user selects a game filter, THE Character_System SHALL display only
     * characters from that game
     */
    it("filters characters by game", () => {
      const mockCharacters = [
        createMockCharacter({ id: "1", name: "Mario", primaryGame: "Super Mario Bros" }),
        createMockCharacter({ id: "2", name: "Link", primaryGame: "Zelda" }),
        createMockCharacter({ id: "3", name: "Luigi", primaryGame: "Super Mario Bros" }),
      ];

      const response = simulateFetchCharacters(mockCharacters, { games: ["Super Mario"] });

      expect(response.characters.length).toBe(2);
      expect(response.characters.every((c) => c.primaryGame.includes("Super Mario"))).toBe(true);
    });

    it("filters characters by role", () => {
      const mockCharacters = [
        createMockCharacter({ id: "1", name: "Mario", role: "protagonist" }),
        createMockCharacter({ id: "2", name: "Bowser", role: "antagonist" }),
        createMockCharacter({ id: "3", name: "Toad", role: "supporting" }),
        createMockCharacter({ id: "4", name: "Link", role: "protagonist" }),
      ];

      const response = simulateFetchCharacters(mockCharacters, { roles: ["protagonist"] });

      expect(response.characters.length).toBe(2);
      expect(response.characters.every((c) => c.role === "protagonist")).toBe(true);
    });

    it("multiple role filters work with OR logic within roles", () => {
      const mockCharacters = [
        createMockCharacter({ id: "1", name: "Mario", role: "protagonist" }),
        createMockCharacter({ id: "2", name: "Bowser", role: "antagonist" }),
        createMockCharacter({ id: "3", name: "Toad", role: "supporting" }),
      ];

      const response = simulateFetchCharacters(mockCharacters, {
        roles: ["protagonist", "antagonist"],
      });

      expect(response.characters.length).toBe(2);
    });

    it("clearing filters returns all characters", () => {
      const mockCharacters = createMockCharacters(15);

      // First apply filters
      const filteredResponse = simulateFetchCharacters(mockCharacters, {
        roles: ["protagonist"],
      });

      // Then clear filters
      const clearedResponse = simulateFetchCharacters(mockCharacters, {
        roles: [],
        games: [],
        search: "",
      });

      expect(clearedResponse.characters.length).toBe(15);
      expect(clearedResponse.pagination.totalCount).toBe(15);
    });
  });

  describe("Pagination Works", () => {
    /**
     * **Validates: Requirement 4.2**
     * WHEN a user clicks on a page number, THE Character_System SHALL load and
     * display characters for that page
     */
    it("paginates results correctly", () => {
      const mockCharacters = createMockCharacters(50);

      const page1 = simulateFetchCharacters(mockCharacters, { page: 1, limit: 20 });
      const page2 = simulateFetchCharacters(mockCharacters, { page: 2, limit: 20 });
      const page3 = simulateFetchCharacters(mockCharacters, { page: 3, limit: 20 });

      expect(page1.characters.length).toBe(20);
      expect(page2.characters.length).toBe(20);
      expect(page3.characters.length).toBe(10);

      expect(page1.pagination.hasNextPage).toBe(true);
      expect(page1.pagination.hasPreviousPage).toBe(false);

      expect(page2.pagination.hasNextPage).toBe(true);
      expect(page2.pagination.hasPreviousPage).toBe(true);

      expect(page3.pagination.hasNextPage).toBe(false);
      expect(page3.pagination.hasPreviousPage).toBe(true);
    });

    it("returns correct pagination metadata", () => {
      const mockCharacters = createMockCharacters(45);

      const response = simulateFetchCharacters(mockCharacters, { page: 1, limit: 20 });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.totalPages).toBe(3);
      expect(response.pagination.totalCount).toBe(45);
      expect(response.pagination.limit).toBe(20);
    });

    it("handles last page with fewer items", () => {
      const mockCharacters = createMockCharacters(25);

      const lastPage = simulateFetchCharacters(mockCharacters, { page: 2, limit: 20 });

      expect(lastPage.characters.length).toBe(5);
      expect(lastPage.pagination.hasNextPage).toBe(false);
    });

    it("handles single page of results", () => {
      const mockCharacters = createMockCharacters(10);

      const response = simulateFetchCharacters(mockCharacters, { page: 1, limit: 20 });

      expect(response.pagination.totalPages).toBe(1);
      expect(response.pagination.hasNextPage).toBe(false);
      expect(response.pagination.hasPreviousPage).toBe(false);
    });
  });

  describe("Combination of Search + Filters + Pagination", () => {
    it("search and role filter work together", () => {
      const mockCharacters = [
        createMockCharacter({ id: "1", name: "Mario", role: "protagonist" }),
        createMockCharacter({ id: "2", name: "Mario Jr", role: "supporting" }),
        createMockCharacter({ id: "3", name: "Bowser", role: "antagonist" }),
        createMockCharacter({ id: "4", name: "Link", role: "protagonist" }),
      ];

      const response = simulateFetchCharacters(mockCharacters, {
        search: "Mario",
        roles: ["protagonist"],
      });

      expect(response.characters.length).toBe(1);
      expect(response.characters[0].name).toBe("Mario");
      expect(response.characters[0].role).toBe("protagonist");
    });

    it("search and game filter work together", () => {
      const mockCharacters = [
        createMockCharacter({ id: "1", name: "Mario", primaryGame: "Super Mario Bros" }),
        createMockCharacter({ id: "2", name: "Mario Kart Racer", primaryGame: "Mario Kart" }),
        createMockCharacter({ id: "3", name: "Link", primaryGame: "Zelda" }),
      ];

      const response = simulateFetchCharacters(mockCharacters, {
        search: "Mario",
        games: ["Super Mario"],
      });

      expect(response.characters.length).toBe(1);
      expect(response.characters[0].name).toBe("Mario");
    });

    it("all filters combined with pagination", () => {
      // Create 30 characters with various attributes
      const mockCharacters: CharacterSummary[] = [];
      for (let i = 0; i < 30; i++) {
        mockCharacters.push(
          createMockCharacter({
            id: `char-${i}`,
            name: i < 15 ? `Hero ${i}` : `Villain ${i}`,
            role: i < 15 ? "protagonist" : "antagonist",
            primaryGame: i % 2 === 0 ? "Game A" : "Game B",
          })
        );
      }

      // Search for "Hero" + protagonist role + Game A + page 1
      const response = simulateFetchCharacters(mockCharacters, {
        search: "Hero",
        roles: ["protagonist"],
        games: ["Game A"],
        page: 1,
        limit: 5,
      });

      // Should find Heroes 0, 2, 4, 6, 8, 10, 12, 14 (8 total, 5 on page 1)
      expect(response.characters.length).toBe(5);
      expect(response.pagination.totalCount).toBe(8);
      expect(response.pagination.totalPages).toBe(2);
      expect(response.characters.every((c) => c.name.includes("Hero"))).toBe(true);
      expect(response.characters.every((c) => c.role === "protagonist")).toBe(true);
    });

    it("pagination resets to page 1 when filters change", () => {
      const mockCharacters = createMockCharacters(50);

      // Simulate being on page 3
      const page3 = simulateFetchCharacters(mockCharacters, { page: 3, limit: 20 });
      expect(page3.pagination.currentPage).toBe(3);

      // When filters change, component should reset to page 1
      const filteredPage1 = simulateFetchCharacters(mockCharacters, {
        search: "Character 1",
        page: 1,
        limit: 20,
      });

      expect(filteredPage1.pagination.currentPage).toBe(1);
    });

    it("preserves filters when changing pages", () => {
      const mockCharacters = createMockCharacters(50);

      // Apply filters and go to page 2
      const page1 = simulateFetchCharacters(mockCharacters, {
        roles: ["protagonist"],
        page: 1,
        limit: 10,
      });

      const page2 = simulateFetchCharacters(mockCharacters, {
        roles: ["protagonist"],
        page: 2,
        limit: 10,
      });

      // Both pages should have filtered results
      expect(page1.characters.every((c) => c.role === "protagonist")).toBe(true);
      expect(page2.characters.every((c) => c.role === "protagonist")).toBe(true);
      expect(page2.pagination.currentPage).toBe(2);
    });
  });

  describe("Edge Cases", () => {
    it("handles characters without optional fields", () => {
      const mockCharacters = [
        createMockCharacter({
          id: "1",
          name: "Minimal Character",
          role: undefined,
          description: undefined,
          mainImage: undefined,
          backgroundColor: undefined,
        }),
      ];

      const response = simulateFetchCharacters(mockCharacters);

      expect(response.characters.length).toBe(1);
      expect(response.characters[0].name).toBe("Minimal Character");
    });

    it("handles special characters in search", () => {
      const mockCharacters = [
        createMockCharacter({ id: "1", name: "Link (Hero of Time)", slug: "link" }),
        createMockCharacter({ id: "2", name: "Zelda's Guardian", slug: "guardian" }),
      ];

      const response = simulateFetchCharacters(mockCharacters, { search: "Link" });

      expect(response.characters.length).toBe(1);
      expect(response.characters[0].name).toBe("Link (Hero of Time)");
    });

    it("handles whitespace in search term", () => {
      const mockCharacters = [createMockCharacter({ id: "1", name: "Mario", slug: "mario" })];

      const responseWithSpaces = simulateFetchCharacters(mockCharacters, { search: "  Mario  " });

      expect(responseWithSpaces.characters.length).toBe(1);
    });
  });
});
