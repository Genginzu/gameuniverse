import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PlayerService } from "../../../../src/lib/services/playerService";
import type {
  PlayerDetails,
  PlayerSummary,
  PlayerLibraryGame,
  PlayerStats,
} from "../../../../src/types/player";

describe("PlayerService", () => {
  let originalFetch: typeof fetch;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockLibraryGame: PlayerLibraryGame = {
    id: "lib-1",
    gameId: "game-1",
    slug: "test-game",
    title: "Test Game",
    coverImage: "https://example.com/cover.jpg",
    status: "owned",
    playTimeHours: 50,
    rating: 8,
    addedAt: "2024-01-15T00:00:00Z",
  };

  const mockStats: PlayerStats = {
    totalGames: 5,
    ownedGames: 3,
    completedGames: 2,
    totalPlayTime: 150,
    averageRating: 8.5,
  };

  const mockPlayerDetails: PlayerDetails = {
    id: "player-uuid-1234",
    fullName: "TestPlayer",
    avatarUrl: "https://example.com/avatar.jpg",
    preferredLocale: "en",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    statsPrivate: false,
    stats: mockStats,
    library: [mockLibraryGame],
  };

  const mockPlayerSummary: PlayerSummary = {
    id: "player-uuid-1234",
    fullName: "TestPlayer",
    avatarUrl: "https://example.com/avatar.jpg",
    gamesCount: 5,
    createdAt: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("calculateStats", () => {
    it("should calculate stats for empty library", () => {
      const result = PlayerService.calculateStats([]);

      expect(result.totalGames).toBe(0);
      expect(result.ownedGames).toBe(0);
      expect(result.completedGames).toBe(0);
      expect(result.totalPlayTime).toBe(0);
      expect(result.averageRating).toBeNull();
    });

    it("should calculate stats for library with games", () => {
      const library: PlayerLibraryGame[] = [
        { ...mockLibraryGame, status: "owned", playTimeHours: 50, rating: 8 },
        { ...mockLibraryGame, id: "lib-2", status: "completed", playTimeHours: 30, rating: 9 },
        { ...mockLibraryGame, id: "lib-3", status: "playing", playTimeHours: 20, rating: null },
        { ...mockLibraryGame, id: "lib-4", status: "wishlist", playTimeHours: 0, rating: null },
      ];

      const result = PlayerService.calculateStats(library);

      expect(result.totalGames).toBe(4);
      expect(result.ownedGames).toBe(3); // owned, completed, playing
      expect(result.completedGames).toBe(1);
      expect(result.totalPlayTime).toBe(100);
      expect(result.averageRating).toBe(8.5); // (8 + 9) / 2
    });

    it("should handle library with no ratings", () => {
      const library: PlayerLibraryGame[] = [
        { ...mockLibraryGame, rating: null },
        { ...mockLibraryGame, id: "lib-2", rating: null },
      ];

      const result = PlayerService.calculateStats(library);

      expect(result.averageRating).toBeNull();
    });

    it("should count all completed games", () => {
      const library: PlayerLibraryGame[] = [
        { ...mockLibraryGame, status: "completed" },
        { ...mockLibraryGame, id: "lib-2", status: "completed" },
        { ...mockLibraryGame, id: "lib-3", status: "owned" },
      ];

      const result = PlayerService.calculateStats(library);

      expect(result.completedGames).toBe(2);
    });
  });

  describe("validatePlayerId", () => {
    it("should return true for valid UUID", () => {
      expect(PlayerService.validatePlayerId("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    });

    it("should return true for uppercase UUID", () => {
      expect(PlayerService.validatePlayerId("123E4567-E89B-12D3-A456-426614174000")).toBe(true);
    });

    it("should return false for invalid UUID format", () => {
      expect(PlayerService.validatePlayerId("not-a-uuid")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(PlayerService.validatePlayerId("")).toBe(false);
    });

    it("should return false for UUID without dashes", () => {
      expect(PlayerService.validatePlayerId("123e4567e89b12d3a456426614174000")).toBe(false);
    });

    it("should return false for UUID with wrong segment lengths", () => {
      expect(PlayerService.validatePlayerId("123e456-e89b-12d3-a456-426614174000")).toBe(false);
    });
  });

  describe("fetchPlayerDetails", () => {
    it("should fetch player details successfully", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ player: mockPlayerDetails }),
      })) as typeof fetch;

      const result = await PlayerService.fetchPlayerDetails("player-uuid-1234", "en");

      expect(result).toEqual(mockPlayerDetails);
    });

    it("should return null for 404 response", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 404,
      })) as typeof fetch;

      const result = await PlayerService.fetchPlayerDetails("non-existent", "en");

      expect(result).toBeNull();
    });

    it("should throw error for non-404 error responses", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      })) as typeof fetch;

      await expect(PlayerService.fetchPlayerDetails("player-uuid-1234", "en")).rejects.toThrow(
        "Failed to fetch player details"
      );
    });

    it("should use default locale when not provided", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ player: mockPlayerDetails }),
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      await PlayerService.fetchPlayerDetails("player-uuid-1234");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("locale=fr"),
        expect.any(Object)
      );
    });

    it("should handle network errors", async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error("Network error");
      }) as typeof fetch;

      await expect(PlayerService.fetchPlayerDetails("player-uuid-1234", "en")).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("fetchPlayers", () => {
    const mockPlayersResponse = {
      players: [mockPlayerSummary],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };

    it("should fetch players list successfully", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockPlayersResponse,
      })) as typeof fetch;

      const result = await PlayerService.fetchPlayers();

      expect(result.players).toHaveLength(1);
      expect(result.players[0]).toEqual(mockPlayerSummary);
      expect(result.pagination.totalCount).toBe(1);
    });

    it("should pass search parameter", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockPlayersResponse,
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      await PlayerService.fetchPlayers({ search: "test" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("search=test"),
        expect.any(Object)
      );
    });

    it("should pass gameCountRange parameter", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockPlayersResponse,
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      await PlayerService.fetchPlayers({ gameCountRange: "1-5" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("gameCountRange=1-5"),
        expect.any(Object)
      );
    });

    it("should pass pagination parameters", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockPlayersResponse,
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      await PlayerService.fetchPlayers({ page: 2, limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/page=2.*limit=10|limit=10.*page=2/),
        expect.any(Object)
      );
    });

    it("should handle items format response", async () => {
      const itemsResponse = {
        items: [mockPlayerSummary],
        pagination: mockPlayersResponse.pagination,
      };
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => itemsResponse,
      })) as typeof fetch;

      const result = await PlayerService.fetchPlayers();

      expect(result.players).toHaveLength(1);
      expect(result.players[0]).toEqual(mockPlayerSummary);
    });

    it("should throw error on failed fetch", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      })) as typeof fetch;

      await expect(PlayerService.fetchPlayers()).rejects.toThrow("Failed to fetch player list");
    });
  });

  describe("playerExists", () => {
    it("should return true when player exists", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockPlayerDetails,
      })) as typeof fetch;

      const result = await PlayerService.playerExists("player-uuid-1234");

      expect(result).toBe(true);
    });

    it("should return false when player does not exist", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 404,
        text: async () => "Not found",
      })) as typeof fetch;

      const result = await PlayerService.playerExists("non-existent");

      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error("Network error");
      }) as typeof fetch;

      const result = await PlayerService.playerExists("player-uuid-1234");

      expect(result).toBe(false);
    });
  });

  describe("generatePlayerMetadata", () => {
    it("should generate metadata for existing player", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockPlayerDetails,
      })) as typeof fetch;

      const result = await PlayerService.generatePlayerMetadata("player-uuid-1234", "en");

      expect(result.title).toBe("TestPlayer - Game Universe");
      expect(result.description).toContain("TestPlayer");
      expect(result.description).toContain("games in library");
    });

    it("should generate French metadata when locale is fr", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockPlayerDetails,
      })) as typeof fetch;

      const result = await PlayerService.generatePlayerMetadata("player-uuid-1234", "fr");

      expect(result.description).toContain("Profil de");
      expect(result.description).toContain("jeux dans sa bibliothèque");
    });

    it("should use default name for player without fullName", async () => {
      const playerWithoutName = { ...mockPlayerDetails, fullName: null };
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => playerWithoutName,
      })) as typeof fetch;

      const result = await PlayerService.generatePlayerMetadata("player-uuid-1234", "en");

      expect(result.title).toBe("Player - Game Universe");
    });

    it("should use French default name when locale is fr", async () => {
      const playerWithoutName = { ...mockPlayerDetails, fullName: null };
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => playerWithoutName,
      })) as typeof fetch;

      const result = await PlayerService.generatePlayerMetadata("player-uuid-1234", "fr");

      expect(result.title).toBe("Joueur - Game Universe");
    });

    it("should include avatar in openGraph images", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockPlayerDetails,
      })) as typeof fetch;

      const result = await PlayerService.generatePlayerMetadata("player-uuid-1234", "en");

      expect(result.openGraph?.images).toContain("https://example.com/avatar.jpg");
    });

    it("should return not found metadata when player does not exist", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 404,
        text: async () => "Not found",
      })) as typeof fetch;

      const result = await PlayerService.generatePlayerMetadata("non-existent", "en");

      expect(result.title).toContain("not found");
    });

    it("should return error metadata on fetch error", async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error("Network error");
      }) as typeof fetch;

      const result = await PlayerService.generatePlayerMetadata("player-uuid-1234", "en");

      expect(result.title).toBe("Error");
    });
  });
});
