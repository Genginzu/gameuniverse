import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GameService } from "../../../../src/lib/services/gameService";
import type { GameDetails, GameSummary } from "../../../../src/types/game";

describe("GameService", () => {
  let originalFetch: typeof fetch;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockGameDetails: GameDetails = {
    id: "game-1",
    slug: "test-game",
    title: "Test Game",
    description: "A test game description",
    releaseDate: "2024-01-15",
    releaseYear: 2024,
    metascore: 85,
    genres: [{ id: "genre-1", slug: "action", name: "Action" }],
    companies: {
      developers: [{ id: "dev-1", name: "Test Dev", slug: "test-dev", isPrimary: true }],
      publishers: [{ id: "pub-1", name: "Test Pub", slug: "test-pub", isPrimary: true }],
    },
    developer: "Test Dev",
    publisher: "Test Pub",
    media: {
      coverImage: "https://example.com/cover.jpg",
      screenshots: [],
      artwork: [],
      videos: [],
    },
    pricing: [],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  };

  const mockGameSummary: GameSummary = {
    id: "game-1",
    slug: "test-game",
    title: "Test Game",
    description: "A test game description",
    coverImage: "https://example.com/cover.jpg",
    releaseDate: "2024-01-15",
    releaseYear: 2024,
    genres: [{ name: "Action", id: "genre-1" }],
    developer: "Test Dev",
    publisher: "Test Pub",
    metascore: 85,
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

  describe("fetchGameDetails", () => {
    it("should fetch game details successfully", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockGameDetails,
      })) as typeof fetch;

      const result = await GameService.fetchGameDetails("test-game", "en");

      expect(result).toEqual(mockGameDetails);
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    it("should return null for 404 response", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 404,
        text: async () => "Not found",
      })) as typeof fetch;

      const result = await GameService.fetchGameDetails("non-existent", "en");

      expect(result).toBeNull();
    });

    it("should throw error for non-404 error responses", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server error",
      })) as typeof fetch;

      await expect(GameService.fetchGameDetails("test-game", "en")).rejects.toThrow(
        "Failed to fetch game details"
      );
    });

    it("should use default locale when not provided", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockGameDetails,
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      await GameService.fetchGameDetails("test-game");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("locale=fr"),
        expect.any(Object)
      );
    });

    it("should handle network errors", async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error("Network error");
      }) as typeof fetch;

      await expect(GameService.fetchGameDetails("test-game", "en")).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("fetchGames", () => {
    const mockGamesResponse = {
      games: [mockGameSummary],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };

    it("should fetch games list successfully", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockGamesResponse,
      })) as typeof fetch;

      const result = await GameService.fetchGames();

      expect(result.games).toHaveLength(1);
      expect(result.games[0]).toEqual(mockGameSummary);
      expect(result.pagination.totalCount).toBe(1);
    });

    it("should pass search parameter", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockGamesResponse,
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      await GameService.fetchGames({ search: "test" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("search=test"),
        expect.any(Object)
      );
    });

    it("should pass genres parameter", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockGamesResponse,
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      await GameService.fetchGames({ genres: ["action", "rpg"] });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("genres=action%2Crpg"),
        expect.any(Object)
      );
    });

    it("should pass pagination parameters", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockGamesResponse,
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      await GameService.fetchGames({ page: 2, limit: 20 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/page=2.*limit=20|limit=20.*page=2/),
        expect.any(Object)
      );
    });

    it("should handle items format response", async () => {
      const itemsResponse = {
        items: [mockGameSummary],
        pagination: mockGamesResponse.pagination,
      };
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => itemsResponse,
      })) as typeof fetch;

      const result = await GameService.fetchGames();

      expect(result.games).toHaveLength(1);
      expect(result.games[0]).toEqual(mockGameSummary);
    });

    it("should throw error on failed fetch", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      })) as typeof fetch;

      await expect(GameService.fetchGames()).rejects.toThrow("Failed to fetch game list");
    });
  });

  describe("gameExists", () => {
    it("should return true when game exists", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockGameDetails,
      })) as typeof fetch;

      const result = await GameService.gameExists("test-game", "en");

      expect(result).toBe(true);
    });

    it("should return false when game does not exist", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 404,
        text: async () => "Not found",
      })) as typeof fetch;

      const result = await GameService.gameExists("non-existent", "en");

      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error("Network error");
      }) as typeof fetch;

      const result = await GameService.gameExists("test-game", "en");

      expect(result).toBe(false);
    });
  });

  describe("generateGameMetadata", () => {
    it("should generate metadata for existing game", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockGameDetails,
      })) as typeof fetch;

      const result = await GameService.generateGameMetadata("test-game", "en");

      expect(result.title).toBe("Test Game - Gamers Universe");
      expect(result.description).toBe("A test game description");
      expect(result.openGraph?.title).toBe("Test Game");
    });

    it("should generate metadata with cover image", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => mockGameDetails,
      })) as typeof fetch;

      const result = await GameService.generateGameMetadata("test-game", "en");

      expect(result.openGraph?.images).toContain("https://example.com/cover.jpg");
    });

    it("should generate French metadata when locale is fr", async () => {
      const gameWithoutDescription = { ...mockGameDetails, description: undefined };
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => gameWithoutDescription,
      })) as typeof fetch;

      const result = await GameService.generateGameMetadata("test-game", "fr");

      expect(result.description).toContain("Découvrez");
    });

    it("should generate English metadata when locale is en", async () => {
      const gameWithoutDescription = { ...mockGameDetails, description: undefined };
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => gameWithoutDescription,
      })) as typeof fetch;

      const result = await GameService.generateGameMetadata("test-game", "en");

      expect(result.description).toContain("Discover");
    });

    it("should return not found metadata when game does not exist", async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 404,
        text: async () => "Not found",
      })) as typeof fetch;

      const result = await GameService.generateGameMetadata("non-existent", "en");

      expect(result.title).toContain("not found");
    });

    it("should return error metadata on fetch error", async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error("Network error");
      }) as typeof fetch;

      const result = await GameService.generateGameMetadata("test-game", "en");

      expect(result.title).toBe("Error");
    });

    it("should return French error metadata on fetch error with fr locale", async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error("Network error");
      }) as typeof fetch;

      const result = await GameService.generateGameMetadata("test-game", "fr");

      expect(result.title).toBe("Erreur");
    });
  });
});
