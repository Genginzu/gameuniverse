import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the supabase-server module before importing CharacterService
const mockSelect = vi.fn(() => mockQuery);
const mockEq = vi.fn(() => mockQuery);
const mockIlike = vi.fn(() => mockQuery);
const mockIn = vi.fn(() => mockQuery);
const mockRange = vi.fn(() => mockQuery);
const mockOrder = vi.fn(() => mockQuery);
const mockSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));

const mockQuery = {
  select: mockSelect,
  eq: mockEq,
  ilike: mockIlike,
  in: mockIn,
  range: mockRange,
  order: mockOrder,
  single: mockSingle,
};

const mockFrom = vi.fn(() => mockQuery);

const mockSupabaseClient = {
  from: mockFrom,
};

vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(async () => mockSupabaseClient),
  createRouteHandlerClient: vi.fn(async () => mockSupabaseClient),
}));

// Import after mocking
import { CharacterService } from "../../../../src/lib/services/characterService";

describe("CharacterService DB Methods", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Reset all mocks
    mockSelect.mockClear();
    mockEq.mockClear();
    mockIlike.mockClear();
    mockIn.mockClear();
    mockRange.mockClear();
    mockOrder.mockClear();
    mockSingle.mockClear();
    mockFrom.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("fetchCharactersFromDB", () => {
    const mockCharacterListData = [
      {
        id: "char-1",
        slug: "test-character",
        main_image: "https://example.com/image.jpg",
        background_color: "#1a1a2e",
        created_at: "2024-01-01T00:00:00Z",
        character_translations: [
          {
            name: "Test Character",
            role: "Hero",
            description: "A test character",
          },
        ],
        character_games: [
          {
            is_primary: true,
            games: {
              id: "game-1",
              slug: "test-game",
              game_translations: [{ title: "Test Game" }],
            },
          },
        ],
      },
    ];

    it("should fetch characters with default options", async () => {
      const countResult = Promise.resolve({ count: 1, error: null });
      // Count query must be thenable — awaited directly when no filters
      const countQuery: Record<string, unknown> = {
        select: vi.fn(() => countQuery),
        eq: vi.fn(() => countQuery),
        ilike: vi.fn(() => countQuery),
        in: vi.fn(() => countQuery),
      };
      countQuery.then = countResult.then.bind(countResult);
      countQuery.catch = countResult.catch.bind(countResult);

      // Setup mock chain for main query
      const mainQuery = {
        select: vi.fn(() => mainQuery),
        eq: vi.fn(() => mainQuery),
        ilike: vi.fn(() => mainQuery),
        in: vi.fn(() => mainQuery),
        range: vi.fn(() => Promise.resolve({ data: mockCharacterListData, error: null })),
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: mockCharacterListData, error: null })),
        })),
      };

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mainQuery;
        return countQuery;
      });

      const result = await CharacterService.fetchCharactersFromDB();

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0].name).toBe("Test Character");
      expect(result.characters[0].slug).toBe("test-character");
      expect(result.pagination.currentPage).toBe(1);
    });

    it("should apply search filter", async () => {
      const countResult = Promise.resolve({ count: 1, error: null });
      const countQuery: Record<string, unknown> = {
        select: vi.fn(() => countQuery),
        eq: vi.fn(() => countQuery),
        ilike: vi.fn(() => countQuery),
      };
      countQuery.then = countResult.then.bind(countResult);
      countQuery.catch = countResult.catch.bind(countResult);

      const mainQuery = {
        select: vi.fn(() => mainQuery),
        eq: vi.fn(() => mainQuery),
        ilike: vi.fn(() => mainQuery),
        range: vi.fn(() => Promise.resolve({ data: mockCharacterListData, error: null })),
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: mockCharacterListData, error: null })),
        })),
      };

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mainQuery;
        return countQuery;
      });

      await CharacterService.fetchCharactersFromDB({ search: "test" });

      expect(mainQuery.ilike).toHaveBeenCalled();
    });

    it("should apply role filter", async () => {
      const countResult = Promise.resolve({ count: 1, error: null });
      const countQuery: Record<string, unknown> = {
        select: vi.fn(() => countQuery),
        eq: vi.fn(() => countQuery),
        in: vi.fn(() => countQuery),
      };
      countQuery.then = countResult.then.bind(countResult);
      countQuery.catch = countResult.catch.bind(countResult);

      const mainQuery = {
        select: vi.fn(() => mainQuery),
        eq: vi.fn(() => mainQuery),
        in: vi.fn(() => mainQuery),
        range: vi.fn(() => Promise.resolve({ data: mockCharacterListData, error: null })),
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: mockCharacterListData, error: null })),
        })),
      };

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mainQuery;
        return countQuery;
      });

      await CharacterService.fetchCharactersFromDB({ roles: ["Hero"] });

      expect(mainQuery.in).toHaveBeenCalled();
    });

    it("should filter by games post-processing", async () => {
      const allData = [
        ...mockCharacterListData,
        {
          id: "char-2",
          slug: "other-character",
          main_image: null,
          background_color: null,
          created_at: "2024-01-02T00:00:00Z",
          character_translations: [{ name: "Other", role: "Villain", description: null }],
          character_games: [
            {
              is_primary: true,
              games: {
                id: "game-2",
                slug: "other-game",
                game_translations: [{ title: "Other Game" }],
              },
            },
          ],
        },
      ];

      const countResult = Promise.resolve({ count: 2, error: null });
      const countQuery: Record<string, unknown> = {
        select: vi.fn(() => countQuery),
        eq: vi.fn(() => countQuery),
        ilike: vi.fn(() => countQuery),
        in: vi.fn(() => countQuery),
      };
      countQuery.then = countResult.then.bind(countResult);
      countQuery.catch = countResult.catch.bind(countResult);

      const mainQuery = {
        select: vi.fn(() => mainQuery),
        eq: vi.fn(() => mainQuery),
        ilike: vi.fn(() => mainQuery),
        in: vi.fn(() => mainQuery),
        range: vi.fn(() => Promise.resolve({ data: allData, error: null })),
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: allData, error: null })),
        })),
      };

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mainQuery;
        return countQuery;
      });

      const result = await CharacterService.fetchCharactersFromDB({ games: ["game-1"] });

      // Should filter to only characters with game-1
      expect(result.characters).toHaveLength(1);
      expect(result.characters[0].slug).toBe("test-character");
    });

    it("should handle count query error", async () => {
      const countResult = Promise.resolve({ count: null, error: { message: "Count error" } });
      const countQuery: Record<string, unknown> = {
        select: vi.fn(() => countQuery),
        eq: vi.fn(() => countQuery),
      };
      countQuery.then = countResult.then.bind(countResult);
      countQuery.catch = countResult.catch.bind(countResult);

      const mainQuery = {
        select: vi.fn(() => mainQuery),
        eq: vi.fn(() => mainQuery),
        range: vi.fn(() => Promise.resolve({ data: [], error: null })),
        order: vi.fn(() => ({ range: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
      };

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mainQuery;
        return countQuery;
      });

      await expect(CharacterService.fetchCharactersFromDB()).rejects.toThrow(
        "Failed to count characters"
      );
    });

    it("should handle main query error", async () => {
      const countResult = Promise.resolve({ count: 1, error: null });
      const countQuery: Record<string, unknown> = {
        select: vi.fn(() => countQuery),
        eq: vi.fn(() => countQuery),
      };
      countQuery.then = countResult.then.bind(countResult);
      countQuery.catch = countResult.catch.bind(countResult);

      const mainQuery = {
        select: vi.fn(() => mainQuery),
        eq: vi.fn(() => mainQuery),
        range: vi.fn(() => Promise.resolve({ data: null, error: { message: "Query error" } })),
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: null, error: { message: "Query error" } })),
        })),
      };

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mainQuery;
        return countQuery;
      });

      await expect(CharacterService.fetchCharactersFromDB()).rejects.toThrow(
        "Failed to fetch characters"
      );
    });

    it("should calculate pagination correctly", async () => {
      const countResult = Promise.resolve({ count: 50, error: null });
      const countQuery: Record<string, unknown> = {
        select: vi.fn(() => countQuery),
        eq: vi.fn(() => countQuery),
      };
      countQuery.then = countResult.then.bind(countResult);
      countQuery.catch = countResult.catch.bind(countResult);

      const mainQuery = {
        select: vi.fn(() => mainQuery),
        eq: vi.fn(() => mainQuery),
        range: vi.fn(() => Promise.resolve({ data: mockCharacterListData, error: null })),
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: mockCharacterListData, error: null })),
        })),
      };

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mainQuery;
        return countQuery;
      });

      const result = await CharacterService.fetchCharactersFromDB({ page: 2, limit: 10 });

      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.totalCount).toBe(50);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPreviousPage).toBe(true);
    });

    it("should handle empty results", async () => {
      const countResult = Promise.resolve({ count: 0, error: null });
      const countQuery: Record<string, unknown> = {
        select: vi.fn(() => countQuery),
        eq: vi.fn(() => countQuery),
      };
      countQuery.then = countResult.then.bind(countResult);
      countQuery.catch = countResult.catch.bind(countResult);

      const mainQuery = {
        select: vi.fn(() => mainQuery),
        eq: vi.fn(() => mainQuery),
        range: vi.fn(() => Promise.resolve({ data: [], error: null })),
        order: vi.fn(() => ({ range: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
      };

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mainQuery;
        return countQuery;
      });

      const result = await CharacterService.fetchCharactersFromDB();

      expect(result.characters).toHaveLength(0);
      expect(result.pagination.totalCount).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe("fetchCharacterDetailsFromDB", () => {
    const mockCharacterDetailsData = {
      id: "char-1",
      slug: "test-character",
      main_image: "https://example.com/main.jpg",
      background_image: "https://example.com/bg.jpg",
      background_color: "#1a1a2e",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
      character_translations: [
        {
          name: "Test Character",
          role: "Hero",
          description: "A test character",
          biography: "Full biography",
          weapons: "Sword",
        },
      ],
      character_games: [
        {
          is_primary: true,
          games: {
            id: "game-1",
            slug: "test-game",
            cover_image_url: "https://example.com/cover.jpg",
            background_image_url: "https://example.com/game-bg.jpg",
            release_date: "2024-01-01",
            game_translations: [{ title: "Test Game" }],
          },
        },
      ],
      character_media: [
        {
          id: "media-1",
          type: "screenshot",
          url: "https://example.com/ss.jpg",
          thumbnail_url: null,
          title: null,
          description: null,
          alt_text: "Screenshot",
          is_featured: true,
          display_order: 1,
        },
      ],
      character_relationships: [
        {
          id: "rel-1",
          relationship_type: "ally",
          description: "A trusted ally",
          related_character: {
            id: "char-2",
            slug: "related-char",
            main_image: "https://example.com/related.jpg",
            character_translations: [{ name: "Related Character", role: "Ally" }],
          },
        },
      ],
    };

    it("should fetch character details successfully", async () => {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        single: vi.fn(() => Promise.resolve({ data: mockCharacterDetailsData, error: null })),
      };

      mockFrom.mockImplementation(() => query);

      const result = await CharacterService.fetchCharacterDetailsFromDB("test-character", "fr");

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Test Character");
      expect(result?.slug).toBe("test-character");
      expect(result?.role).toBe("Hero");
      expect(result?.games).toHaveLength(1);
      expect(result?.media.screenshots).toHaveLength(1);
      expect(result?.relationships).toHaveLength(1);
    });

    it("should return null for non-existent character", async () => {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        single: vi.fn(() =>
          Promise.resolve({ data: null, error: { code: "PGRST116", message: "No rows" } })
        ),
      };

      mockFrom.mockImplementation(() => query);

      const result = await CharacterService.fetchCharacterDetailsFromDB("non-existent", "fr");

      expect(result).toBeNull();
    });

    it("should throw error for database errors", async () => {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        single: vi.fn(() =>
          Promise.resolve({ data: null, error: { code: "OTHER", message: "Database error" } })
        ),
      };

      mockFrom.mockImplementation(() => query);

      await expect(
        CharacterService.fetchCharacterDetailsFromDB("test-character", "fr")
      ).rejects.toThrow("Failed to fetch character details");
    });

    it("should handle character with no games", async () => {
      const dataWithNoGames = {
        ...mockCharacterDetailsData,
        character_games: [],
      };

      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        single: vi.fn(() => Promise.resolve({ data: dataWithNoGames, error: null })),
      };

      mockFrom.mockImplementation(() => query);

      const result = await CharacterService.fetchCharacterDetailsFromDB("test-character", "fr");

      expect(result?.games).toHaveLength(0);
      expect(result?.primaryGame).toBe("Unknown");
    });

    it("should handle character with no media", async () => {
      const dataWithNoMedia = {
        ...mockCharacterDetailsData,
        character_media: [],
      };

      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        single: vi.fn(() => Promise.resolve({ data: dataWithNoMedia, error: null })),
      };

      mockFrom.mockImplementation(() => query);

      const result = await CharacterService.fetchCharacterDetailsFromDB("test-character", "fr");

      expect(result?.media.screenshots).toHaveLength(0);
      expect(result?.media.artwork).toHaveLength(0);
      expect(result?.media.videos).toHaveLength(0);
    });

    it("should handle character with no relationships", async () => {
      const dataWithNoRelationships = {
        ...mockCharacterDetailsData,
        character_relationships: [],
      };

      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        single: vi.fn(() => Promise.resolve({ data: dataWithNoRelationships, error: null })),
      };

      mockFrom.mockImplementation(() => query);

      const result = await CharacterService.fetchCharacterDetailsFromDB("test-character", "fr");

      expect(result?.relationships).toHaveLength(0);
    });

    it("should sort games with primary first", async () => {
      const dataWithMultipleGames = {
        ...mockCharacterDetailsData,
        character_games: [
          {
            is_primary: false,
            games: {
              id: "game-2",
              slug: "second-game",
              cover_image_url: null,
              background_image_url: null,
              release_date: "2023-01-01",
              game_translations: [{ title: "Second Game" }],
            },
          },
          {
            is_primary: true,
            games: {
              id: "game-1",
              slug: "primary-game",
              cover_image_url: null,
              background_image_url: null,
              release_date: "2024-01-01",
              game_translations: [{ title: "Primary Game" }],
            },
          },
        ],
      };

      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        single: vi.fn(() => Promise.resolve({ data: dataWithMultipleGames, error: null })),
      };

      mockFrom.mockImplementation(() => query);

      const result = await CharacterService.fetchCharacterDetailsFromDB("test-character", "fr");

      expect(result?.games[0].title).toBe("Primary Game");
      expect(result?.games[0].isPrimary).toBe(true);
    });

    it("should process different media types correctly", async () => {
      const dataWithAllMediaTypes = {
        ...mockCharacterDetailsData,
        character_media: [
          {
            id: "ss-1",
            type: "screenshot",
            url: "https://example.com/ss.jpg",
            thumbnail_url: null,
            title: null,
            description: null,
            alt_text: "Screenshot",
            is_featured: true,
            display_order: 1,
          },
          {
            id: "art-1",
            type: "artwork",
            url: "https://example.com/art.jpg",
            thumbnail_url: null,
            title: "Concept Art",
            description: "Early concept",
            alt_text: "Artwork",
            is_featured: false,
            display_order: 1,
          },
          {
            id: "vid-1",
            type: "video",
            url: "https://example.com/video.mp4",
            thumbnail_url: "https://example.com/thumb.jpg",
            title: "Trailer",
            description: "Character trailer",
            alt_text: null,
            is_featured: true,
            display_order: 1,
          },
        ],
      };

      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        single: vi.fn(() => Promise.resolve({ data: dataWithAllMediaTypes, error: null })),
      };

      mockFrom.mockImplementation(() => query);

      const result = await CharacterService.fetchCharacterDetailsFromDB("test-character", "fr");

      expect(result?.media.screenshots).toHaveLength(1);
      expect(result?.media.artwork).toHaveLength(1);
      expect(result?.media.videos).toHaveLength(1);
      expect(result?.media.videos[0].title).toBe("Trailer");
    });
  });
});
