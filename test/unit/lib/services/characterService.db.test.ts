import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";

// Mock the supabase-server module before importing CharacterService
const mockSelect = mock(() => mockQuery);
const mockEq = mock(() => mockQuery);
const mockIlike = mock(() => mockQuery);
const mockIn = mock(() => mockQuery);
const mockRange = mock(() => mockQuery);
const mockOrder = mock(() => mockQuery);
const mockSingle = mock(() => Promise.resolve({ data: null, error: null }));

const mockQuery = {
  select: mockSelect,
  eq: mockEq,
  ilike: mockIlike,
  in: mockIn,
  range: mockRange,
  order: mockOrder,
  single: mockSingle,
};

const mockFrom = mock(() => mockQuery);

const mockSupabaseClient = {
  from: mockFrom,
};

mock.module("@/lib/supabase-server", () => ({
  createServerClient: mock(async () => mockSupabaseClient),
  createRouteHandlerClient: mock(async () => mockSupabaseClient),
}));

// Import after mocking
import { CharacterService } from "../../../../src/lib/services/characterService";

describe("CharacterService DB Methods", () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
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
      // Setup mock chain for count query
      const countQuery = {
        select: mock(() => countQuery),
        eq: mock(() => countQuery),
        ilike: mock(() => countQuery),
        in: mock(() => Promise.resolve({ count: 1, error: null })),
      };

      // Setup mock chain for main query
      const mainQuery = {
        select: mock(() => mainQuery),
        eq: mock(() => mainQuery),
        ilike: mock(() => mainQuery),
        in: mock(() => mainQuery),
        range: mock(() => mainQuery),
        order: mock(() => Promise.resolve({ data: mockCharacterListData, error: null })),
      };

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        // First call is for main query, second is for count
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
      const countQuery = {
        select: mock(() => countQuery),
        eq: mock(() => countQuery),
        ilike: mock(() => Promise.resolve({ count: 1, error: null })),
      };

      const mainQuery = {
        select: mock(() => mainQuery),
        eq: mock(() => mainQuery),
        ilike: mock(() => mainQuery),
        range: mock(() => mainQuery),
        order: mock(() => Promise.resolve({ data: mockCharacterListData, error: null })),
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
      const countQuery = {
        select: mock(() => countQuery),
        eq: mock(() => countQuery),
        in: mock(() => Promise.resolve({ count: 1, error: null })),
      };

      const mainQuery = {
        select: mock(() => mainQuery),
        eq: mock(() => mainQuery),
        in: mock(() => mainQuery),
        range: mock(() => mainQuery),
        order: mock(() => Promise.resolve({ data: mockCharacterListData, error: null })),
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
      const countQuery = {
        select: mock(() => countQuery),
        eq: mock(() => countQuery),
        ilike: mock(() => countQuery),
        in: mock(() => Promise.resolve({ count: 2, error: null })),
      };

      const mainQuery = {
        select: mock(() => mainQuery),
        eq: mock(() => mainQuery),
        ilike: mock(() => mainQuery),
        in: mock(() => mainQuery),
        range: mock(() => mainQuery),
        order: mock(() =>
          Promise.resolve({
            data: [
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
            ],
            error: null,
          })
        ),
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
      const countQuery = {
        select: mock(() => countQuery),
        eq: mock(() => Promise.resolve({ count: null, error: { message: "Count error" } })),
      };

      const mainQuery = {
        select: mock(() => mainQuery),
        eq: mock(() => mainQuery),
        range: mock(() => mainQuery),
        order: mock(() => Promise.resolve({ data: [], error: null })),
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
      const countQuery = {
        select: mock(() => countQuery),
        eq: mock(() => Promise.resolve({ count: 1, error: null })),
      };

      const mainQuery = {
        select: mock(() => mainQuery),
        eq: mock(() => mainQuery),
        range: mock(() => mainQuery),
        order: mock(() => Promise.resolve({ data: null, error: { message: "Query error" } })),
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
      const countQuery = {
        select: mock(() => countQuery),
        eq: mock(() => Promise.resolve({ count: 50, error: null })),
      };

      const mainQuery = {
        select: mock(() => mainQuery),
        eq: mock(() => mainQuery),
        range: mock(() => mainQuery),
        order: mock(() => Promise.resolve({ data: mockCharacterListData, error: null })),
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
      const countQuery = {
        select: mock(() => countQuery),
        eq: mock(() => Promise.resolve({ count: 0, error: null })),
      };

      const mainQuery = {
        select: mock(() => mainQuery),
        eq: mock(() => mainQuery),
        range: mock(() => mainQuery),
        order: mock(() => Promise.resolve({ data: [], error: null })),
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
        select: mock(() => query),
        eq: mock(() => query),
        single: mock(() => Promise.resolve({ data: mockCharacterDetailsData, error: null })),
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
        select: mock(() => query),
        eq: mock(() => query),
        single: mock(() =>
          Promise.resolve({ data: null, error: { code: "PGRST116", message: "No rows" } })
        ),
      };

      mockFrom.mockImplementation(() => query);

      const result = await CharacterService.fetchCharacterDetailsFromDB("non-existent", "fr");

      expect(result).toBeNull();
    });

    it("should throw error for database errors", async () => {
      const query = {
        select: mock(() => query),
        eq: mock(() => query),
        single: mock(() =>
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
        select: mock(() => query),
        eq: mock(() => query),
        single: mock(() => Promise.resolve({ data: dataWithNoGames, error: null })),
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
        select: mock(() => query),
        eq: mock(() => query),
        single: mock(() => Promise.resolve({ data: dataWithNoMedia, error: null })),
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
        select: mock(() => query),
        eq: mock(() => query),
        single: mock(() => Promise.resolve({ data: dataWithNoRelationships, error: null })),
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
        select: mock(() => query),
        eq: mock(() => query),
        single: mock(() => Promise.resolve({ data: dataWithMultipleGames, error: null })),
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
        select: mock(() => query),
        eq: mock(() => query),
        single: mock(() => Promise.resolve({ data: dataWithAllMediaTypes, error: null })),
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
