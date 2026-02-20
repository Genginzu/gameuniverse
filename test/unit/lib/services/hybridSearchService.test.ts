import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { HybridSearchService } from "../../../../src/lib/services/hybridSearchService";
import { GameService } from "../../../../src/lib/services/gameService";
import { IGDBService } from "../../../../src/lib/services/igdbService";
import type { GameSummary } from "../../../../src/types/game";
import type { IGDBSearchResult } from "../../../../src/types/igdb";

describe("HybridSearchService", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockLocalGames: GameSummary[] = [
    {
      id: "local-1",
      slug: "local-game-1",
      title: "Local Game 1",
      coverImage: "https://example.com/cover1.jpg",
      developer: "Local Dev",
      releaseYear: 2024,
      igdbId: 1001,
    },
    {
      id: "local-2",
      slug: "local-game-2",
      title: "Local Game 2",
      coverImage: "https://example.com/cover2.jpg",
      developer: "Local Dev 2",
      releaseYear: 2023,
      igdbId: 1002,
    },
  ];

  const mockIgdbGames: IGDBSearchResult[] = [
    {
      id: 2001,
      name: "IGDB Game 1",
      slug: "igdb-game-1",
      cover_url: "https://images.igdb.com/cover1.jpg",
      developer: "IGDB Dev",
      release_year: 2024,
    },
    {
      id: 2002,
      name: "IGDB Game 2",
      slug: "igdb-game-2",
      cover_url: "https://images.igdb.com/cover2.jpg",
      developer: "IGDB Dev 2",
      release_year: 2023,
    },
  ];

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("search", () => {
    it("should search both local and IGDB sources in parallel", async () => {
      const fetchGamesSpy = vi.spyOn(GameService, "fetchGames").mockResolvedValue({
        games: mockLocalGames,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 2,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const searchGamesSpy = vi.spyOn(IGDBService, "searchGames").mockResolvedValue(mockIgdbGames);

      const result = await HybridSearchService.search({ query: "test" });

      expect(fetchGamesSpy).toHaveBeenCalled();
      expect(searchGamesSpy).toHaveBeenCalled();
      expect(result.localGames).toHaveLength(2);
      expect(result.igdbGames).toHaveLength(2);

      fetchGamesSpy.mockRestore();
      searchGamesSpy.mockRestore();
    });

    it("should handle local search failure gracefully", async () => {
      const fetchGamesSpy = vi.spyOn(GameService, "fetchGames").mockRejectedValue(
        new Error("Database error")
      );

      const searchGamesSpy = vi.spyOn(IGDBService, "searchGames").mockResolvedValue(mockIgdbGames);

      const result = await HybridSearchService.search({ query: "test" });

      expect(result.localGames).toHaveLength(0);
      expect(result.igdbGames).toHaveLength(2);
      expect(consoleErrorSpy).toHaveBeenCalled();

      fetchGamesSpy.mockRestore();
      searchGamesSpy.mockRestore();
    });

    it("should handle IGDB search failure gracefully", async () => {
      const fetchGamesSpy = vi.spyOn(GameService, "fetchGames").mockResolvedValue({
        games: mockLocalGames,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 2,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const searchGamesSpy = vi.spyOn(IGDBService, "searchGames").mockRejectedValue(
        new Error("IGDB API error")
      );

      const result = await HybridSearchService.search({ query: "test" });

      expect(result.localGames).toHaveLength(2);
      expect(result.igdbGames).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalled();

      fetchGamesSpy.mockRestore();
      searchGamesSpy.mockRestore();
    });

    it("should handle both sources failing gracefully", async () => {
      const fetchGamesSpy = vi.spyOn(GameService, "fetchGames").mockRejectedValue(
        new Error("Database error")
      );

      const searchGamesSpy = vi.spyOn(IGDBService, "searchGames").mockRejectedValue(
        new Error("IGDB API error")
      );

      const result = await HybridSearchService.search({ query: "test" });

      expect(result.localGames).toHaveLength(0);
      expect(result.igdbGames).toHaveLength(0);

      fetchGamesSpy.mockRestore();
      searchGamesSpy.mockRestore();
    });

    it("should apply custom limits", async () => {
      const manyLocalGames = Array.from({ length: 10 }, (_, i) => ({
        ...mockLocalGames[0],
        id: `local-${i}`,
        slug: `local-game-${i}`,
      }));

      const manyIgdbGames = Array.from({ length: 10 }, (_, i) => ({
        ...mockIgdbGames[0],
        id: 3000 + i,
        slug: `igdb-game-${i}`,
      }));

      const fetchGamesSpy = vi.spyOn(GameService, "fetchGames").mockResolvedValue({
        games: manyLocalGames,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const searchGamesSpy = vi.spyOn(IGDBService, "searchGames").mockResolvedValue(manyIgdbGames);

      const result = await HybridSearchService.search({
        query: "test",
        localLimit: 3,
        igdbLimit: 2,
      });

      expect(result.localGames).toHaveLength(3);
      expect(result.igdbGames).toHaveLength(2);
      expect(result.hasMore).toBe(true);

      fetchGamesSpy.mockRestore();
      searchGamesSpy.mockRestore();
    });

    it("should set hasMore correctly when results exceed limits", async () => {
      const manyLocalGames = Array.from({ length: 6 }, (_, i) => ({
        ...mockLocalGames[0],
        id: `local-${i}`,
        igdbId: 5000 + i,
      }));

      const fetchGamesSpy = vi.spyOn(GameService, "fetchGames").mockResolvedValue({
        games: manyLocalGames,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 6,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const searchGamesSpy = vi.spyOn(IGDBService, "searchGames").mockResolvedValue([]);

      const result = await HybridSearchService.search({
        query: "test",
        localLimit: 5,
      });

      expect(result.hasMore).toBe(true);

      fetchGamesSpy.mockRestore();
      searchGamesSpy.mockRestore();
    });

    it("should use default locale when not specified", async () => {
      const fetchGamesSpy = vi.spyOn(GameService, "fetchGames").mockResolvedValue({
        games: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const searchGamesSpy = vi.spyOn(IGDBService, "searchGames").mockResolvedValue([]);

      await HybridSearchService.search({ query: "test" });

      expect(fetchGamesSpy).toHaveBeenCalledWith(expect.objectContaining({ locale: "fr" }));

      fetchGamesSpy.mockRestore();
      searchGamesSpy.mockRestore();
    });
  });

  describe("deduplicateResults", () => {
    it("should remove IGDB games that exist locally by igdbId", () => {
      const localGames: GameSummary[] = [
        { ...mockLocalGames[0], igdbId: 2001 }, // Same as first IGDB game
      ];

      const result = HybridSearchService.deduplicateResults(localGames, mockIgdbGames);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2002);
    });

    it("should remove IGDB games that exist locally by slug", () => {
      const localGames: GameSummary[] = [
        { ...mockLocalGames[0], igdbId: undefined, slug: "igdb-game-1" },
      ];

      const result = HybridSearchService.deduplicateResults(localGames, mockIgdbGames);

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("igdb-game-2");
    });

    it("should remove IGDB games that exist locally by normalized title", () => {
      const localGames: GameSummary[] = [
        { ...mockLocalGames[0], igdbId: undefined, slug: "different-slug", title: "IGDB Game 1" },
      ];

      const result = HybridSearchService.deduplicateResults(localGames, mockIgdbGames);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("IGDB Game 2");
    });

    it("should handle empty local games", () => {
      const result = HybridSearchService.deduplicateResults([], mockIgdbGames);

      expect(result).toHaveLength(2);
    });

    it("should handle empty IGDB games", () => {
      const result = HybridSearchService.deduplicateResults(mockLocalGames, []);

      expect(result).toHaveLength(0);
    });

    it("should handle both empty arrays", () => {
      const result = HybridSearchService.deduplicateResults([], []);

      expect(result).toHaveLength(0);
    });

    it("should handle case-insensitive slug matching", () => {
      const localGames: GameSummary[] = [
        { ...mockLocalGames[0], igdbId: undefined, slug: "IGDB-GAME-1" },
      ];

      const result = HybridSearchService.deduplicateResults(localGames, mockIgdbGames);

      expect(result).toHaveLength(1);
    });
  });

  describe("toSearchResultItems", () => {
    it("should convert local and IGDB games to unified format", () => {
      const result = HybridSearchService.toSearchResultItems(mockLocalGames, mockIgdbGames);

      expect(result).toHaveLength(4);

      // Local games first
      expect(result[0].source).toBe("local");
      expect(result[0].title).toBe("Local Game 1");
      expect(result[1].source).toBe("local");

      // IGDB games after
      expect(result[2].source).toBe("igdb");
      expect(result[2].title).toBe("IGDB Game 1");
      expect(result[3].source).toBe("igdb");
    });

    it("should handle empty local games", () => {
      const result = HybridSearchService.toSearchResultItems([], mockIgdbGames);

      expect(result).toHaveLength(2);
      expect(result[0].source).toBe("igdb");
    });

    it("should handle empty IGDB games", () => {
      const result = HybridSearchService.toSearchResultItems(mockLocalGames, []);

      expect(result).toHaveLength(2);
      expect(result[0].source).toBe("local");
    });

    it("should map all fields correctly for local games", () => {
      const result = HybridSearchService.toSearchResultItems(mockLocalGames, []);

      expect(result[0]).toEqual({
        id: "local-1",
        igdbId: 1001,
        slug: "local-game-1",
        title: "Local Game 1",
        coverUrl: "https://example.com/cover1.jpg",
        developer: "Local Dev",
        releaseYear: 2024,
        source: "local",
      });
    });

    it("should map all fields correctly for IGDB games", () => {
      const result = HybridSearchService.toSearchResultItems([], mockIgdbGames);

      expect(result[0]).toEqual({
        id: "2001",
        igdbId: 2001,
        slug: "igdb-game-1",
        title: "IGDB Game 1",
        coverUrl: "https://images.igdb.com/cover1.jpg",
        developer: "IGDB Dev",
        releaseYear: 2024,
        source: "igdb",
      });
    });
  });
});
