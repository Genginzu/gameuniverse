import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";

// Mock Supabase client setup
const mockInsert = mock(() => Promise.resolve({ error: null }));
const mockRpc = mock(() => Promise.resolve({ data: null, error: null }));

const mockDeleteChain = {
  eq: mock(() => mockDeleteChain),
  delete: mock(() => mockDeleteChain),
};

const mockSelectChain = {
  select: mock(() => mockSelectChain),
  eq: mock(() => mockSelectChain),
  order: mock(() => Promise.resolve({ data: [], error: null })),
};

const mockFrom = mock((table: string) => {
  // Return appropriate chain based on usage
  return {
    insert: mockInsert,
    delete: () => mockDeleteChain,
    select: mockSelectChain.select,
  };
});

const mockSupabaseClient = {
  from: mockFrom,
  rpc: mockRpc,
};

mock.module("@/lib/supabase-server", () => ({
  createServerClient: mock(async () => mockSupabaseClient),
  createRouteHandlerClient: mock(async () => mockSupabaseClient),
}));

// Import after mocking
import { CharacterFavoriteService } from "../../../../src/lib/services/characterFavoriteService";

describe("CharacterFavoriteService", () => {
  let consoleWarnSpy: ReturnType<typeof spyOn>;
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    mockInsert.mockClear();
    mockRpc.mockClear();
    mockFrom.mockClear();
    mockDeleteChain.eq.mockClear();
    mockSelectChain.select.mockClear();
    mockSelectChain.eq.mockClear();
    mockSelectChain.order.mockClear();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("addFavorite", () => {
    it("should insert a favorite successfully", async () => {
      mockInsert.mockResolvedValueOnce({ error: null });

      await CharacterFavoriteService.addFavorite("char-1", "user-1");

      expect(mockFrom).toHaveBeenCalledWith("character_favorites");
    });

    it("should handle PGRST205 gracefully", async () => {
      mockInsert.mockResolvedValueOnce({
        error: { code: "PGRST205", message: "Table not found" },
      });

      // Should not throw
      await CharacterFavoriteService.addFavorite("char-1", "user-1");
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should throw on other errors", async () => {
      const dbError = { code: "23505", message: "Unique violation" };
      mockInsert.mockResolvedValueOnce({ error: dbError });

      await expect(CharacterFavoriteService.addFavorite("char-1", "user-1")).rejects.toEqual(
        dbError
      );
    });
  });

  describe("removeFavorite", () => {
    it("should delete a favorite successfully", async () => {
      // Setup the delete chain to resolve without error
      mockDeleteChain.eq.mockReturnValueOnce({
        eq: mock(() => Promise.resolve({ error: null })),
      });

      await CharacterFavoriteService.removeFavorite("char-1", "user-1");

      expect(mockFrom).toHaveBeenCalledWith("character_favorites");
    });

    it("should handle PGRST205 gracefully", async () => {
      mockDeleteChain.eq.mockReturnValueOnce({
        eq: mock(() =>
          Promise.resolve({ error: { code: "PGRST205", message: "Table not found" } })
        ),
      });

      await CharacterFavoriteService.removeFavorite("char-1", "user-1");
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe("isFavorite", () => {
    it("should return true when character is favorited", async () => {
      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      const result = await CharacterFavoriteService.isFavorite("char-1", "user-1");

      expect(result).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith("is_character_favorited", {
        user_uuid: "user-1",
        character_uuid: "char-1",
      });
    });

    it("should return false when character is not favorited", async () => {
      mockRpc.mockResolvedValueOnce({ data: false, error: null });

      const result = await CharacterFavoriteService.isFavorite("char-1", "user-1");

      expect(result).toBe(false);
    });

    it("should return false on PGRST205", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST205", message: "Function not found" },
      });

      const result = await CharacterFavoriteService.isFavorite("char-1", "user-1");

      expect(result).toBe(false);
    });

    it("should return false on 42883 (function not found)", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { code: "42883", message: "Function not found" },
      });

      const result = await CharacterFavoriteService.isFavorite("char-1", "user-1");

      expect(result).toBe(false);
    });

    it("should throw on other errors", async () => {
      const dbError = { code: "OTHER", message: "DB error" };
      mockRpc.mockResolvedValueOnce({ data: null, error: dbError });

      await expect(CharacterFavoriteService.isFavorite("char-1", "user-1")).rejects.toEqual(
        dbError
      );
    });
  });

  describe("getFavoriteCount", () => {
    it("should return the count", async () => {
      mockRpc.mockResolvedValueOnce({ data: 42, error: null });

      const result = await CharacterFavoriteService.getFavoriteCount("char-1");

      expect(result).toBe(42);
      expect(mockRpc).toHaveBeenCalledWith("get_character_favorite_count", {
        character_uuid: "char-1",
      });
    });

    it("should return 0 when count is null", async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });

      const result = await CharacterFavoriteService.getFavoriteCount("char-1");

      expect(result).toBe(0);
    });

    it("should return 0 on PGRST205", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST205", message: "Function not found" },
      });

      const result = await CharacterFavoriteService.getFavoriteCount("char-1");

      expect(result).toBe(0);
    });

    it("should return 0 on 42883 (function not found)", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { code: "42883", message: "Function not found" },
      });

      const result = await CharacterFavoriteService.getFavoriteCount("char-1");

      expect(result).toBe(0);
    });

    it("should return 0 for a character with no favorites", async () => {
      mockRpc.mockResolvedValueOnce({ data: 0, error: null });

      const result = await CharacterFavoriteService.getFavoriteCount("char-no-favs");

      expect(result).toBe(0);
    });
  });

  describe("getUserFavorites", () => {
    const mockFavoriteRows = [
      {
        character_id: "char-1",
        created_at: "2024-01-15T00:00:00Z",
        characters: {
          id: "char-1",
          slug: "hero-character",
          main_image: "https://example.com/hero.jpg",
          background_color: "#1a1a2e",
          character_translations: [{ name: "Hero", role: "Protagonist" }],
          character_games: [
            {
              is_primary: true,
              games: { game_translations: [{ title: "Epic Game" }] },
            },
          ],
        },
      },
    ];

    it("should return transformed favorites", async () => {
      const query = {
        select: mock(() => query),
        eq: mock(() => query),
        order: mock(() => Promise.resolve({ data: mockFavoriteRows, error: null })),
      };
      mockFrom.mockReturnValueOnce(query);

      const result = await CharacterFavoriteService.getUserFavorites("user-1", "fr");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("char-1");
      expect(result[0].slug).toBe("hero-character");
      expect(result[0].name).toBe("Hero");
      expect(result[0].role).toBe("Protagonist");
      expect(result[0].primaryGame).toBe("Epic Game");
      expect(result[0].favoritedAt).toBe("2024-01-15T00:00:00Z");
    });

    it("should return empty array on PGRST205", async () => {
      const query = {
        select: mock(() => query),
        eq: mock(() => query),
        order: mock(() =>
          Promise.resolve({ data: null, error: { code: "PGRST205", message: "Table not found" } })
        ),
      };
      mockFrom.mockReturnValueOnce(query);

      const result = await CharacterFavoriteService.getUserFavorites("user-1", "fr");

      expect(result).toEqual([]);
    });

    it("should filter out rows with null characters", async () => {
      const rowsWithNull = [
        ...mockFavoriteRows,
        { character_id: "char-deleted", created_at: "2024-01-10T00:00:00Z", characters: null },
      ];
      const query = {
        select: mock(() => query),
        eq: mock(() => query),
        order: mock(() => Promise.resolve({ data: rowsWithNull, error: null })),
      };
      mockFrom.mockReturnValueOnce(query);

      const result = await CharacterFavoriteService.getUserFavorites("user-1", "fr");

      expect(result).toHaveLength(1);
    });

    it("should handle character with no primary game", async () => {
      const rowsNoPrimary = [
        {
          character_id: "char-2",
          created_at: "2024-01-10T00:00:00Z",
          characters: {
            id: "char-2",
            slug: "side-char",
            main_image: null,
            background_color: null,
            character_translations: [{ name: "Side Char", role: null }],
            character_games: [
              {
                is_primary: false,
                games: { game_translations: [{ title: "Some Game" }] },
              },
            ],
          },
        },
      ];
      const query = {
        select: mock(() => query),
        eq: mock(() => query),
        order: mock(() => Promise.resolve({ data: rowsNoPrimary, error: null })),
      };
      mockFrom.mockReturnValueOnce(query);

      const result = await CharacterFavoriteService.getUserFavorites("user-1", "fr");

      expect(result[0].primaryGame).toBe("Some Game");
      expect(result[0].role).toBeUndefined();
      expect(result[0].mainImage).toBeUndefined();
    });

    it("should return empty array when user has no favorites", async () => {
      const query = {
        select: mock(() => query),
        eq: mock(() => query),
        order: mock(() => Promise.resolve({ data: [], error: null })),
      };
      mockFrom.mockReturnValueOnce(query);

      const result = await CharacterFavoriteService.getUserFavorites("user-1", "fr");

      expect(result).toEqual([]);
    });
  });

  describe("getPlayerFavorites", () => {
    it("should delegate to the same fetch logic as getUserFavorites", async () => {
      const query = {
        select: mock(() => query),
        eq: mock(() => query),
        order: mock(() => Promise.resolve({ data: [], error: null })),
      };
      mockFrom.mockReturnValueOnce(query);

      const result = await CharacterFavoriteService.getPlayerFavorites("player-1", "en");

      expect(result).toEqual([]);
      expect(mockFrom).toHaveBeenCalledWith("character_favorites");
    });
  });
});
