import { describe, it, expect, vi, beforeEach } from "vitest";
import { GlobalSearchService } from "@/lib/services/globalSearchService";
import { HybridSearchService } from "@/lib/services/hybridSearchService";
import { CharacterService } from "@/lib/services/characterService";
import { PlayerService } from "@/lib/services/playerService";
import type { GlobalSearchRequest } from "@/types/global-search";

vi.mock("@/lib/services/hybridSearchService");
vi.mock("@/lib/services/characterService");
vi.mock("@/lib/services/playerService");

const mockHybridSearch = vi.mocked(HybridSearchService.search);
const mockFetchCharacters = vi.mocked(CharacterService.fetchCharacters);
const mockFetchPlayers = vi.mocked(PlayerService.fetchPlayersFromDB);

function buildRequest(overrides: Partial<GlobalSearchRequest> = {}): GlobalSearchRequest {
  return { query: "zelda", locale: "fr", ...overrides };
}

describe("GlobalSearchService.search", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockHybridSearch.mockResolvedValue({
      localGames: [],
      igdbGames: [],
      hasMore: false,
      errors: [],
    });
    mockFetchCharacters.mockResolvedValue({
      characters: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
    mockFetchPlayers.mockResolvedValue({
      players: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });

  it("should execute all three searches in parallel", async () => {
    await GlobalSearchService.search(buildRequest());

    expect(mockHybridSearch).toHaveBeenCalledOnce();
    expect(mockFetchCharacters).toHaveBeenCalledOnce();
    expect(mockFetchPlayers).toHaveBeenCalledOnce();
  });

  it("should pass correct parameters to each service", async () => {
    await GlobalSearchService.search(
      buildRequest({
        query: "mario",
        locale: "en",
        gamesLimit: 3,
        charactersLimit: 7,
        playersLimit: 2,
      })
    );

    expect(mockHybridSearch).toHaveBeenCalledWith({
      query: "mario",
      locale: "en",
      localLimit: 3,
      igdbLimit: 3,
    });
    expect(mockFetchCharacters).toHaveBeenCalledWith({
      search: "mario",
      locale: "en",
      limit: 7,
      page: 1,
    });
    expect(mockFetchPlayers).toHaveBeenCalledWith({
      search: "mario",
      limit: 2,
      page: 1,
    });
  });

  it("should use default limit of 5 when not specified", async () => {
    await GlobalSearchService.search(buildRequest({ query: "test" }));

    expect(mockHybridSearch).toHaveBeenCalledWith(
      expect.objectContaining({ localLimit: 5, igdbLimit: 5 })
    );
    expect(mockFetchCharacters).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
    expect(mockFetchPlayers).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
  });

  it("should return results from all sources when all succeed", async () => {
    const localGame = { id: "g1", slug: "zelda", title: "Zelda" } as never;
    const igdbGame = { id: 99, name: "Zelda IGDB", slug: "zelda-igdb" } as never;
    const character = {
      id: "c1",
      slug: "link",
      name: "Link",
      primaryGame: "Zelda",
      gamesCount: 1,
    } as never;
    const player = {
      id: "p1",
      fullName: "Player1",
      avatarUrl: null,
      gamesCount: 5,
      createdAt: "2024-01-01",
    } as never;

    mockHybridSearch.mockResolvedValue({
      localGames: [localGame],
      igdbGames: [igdbGame],
      hasMore: false,
      errors: [],
    });
    mockFetchCharacters.mockResolvedValue({
      characters: [character],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
    mockFetchPlayers.mockResolvedValue({
      players: [player],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    const result = await GlobalSearchService.search(buildRequest());

    expect(result.games.local).toHaveLength(1);
    expect(result.games.igdb).toHaveLength(1);
    expect(result.characters).toHaveLength(1);
    expect(result.players).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("should return empty arrays for failed sources and log errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockHybridSearch.mockRejectedValue(new Error("IGDB timeout"));
    mockFetchCharacters.mockResolvedValue({
      characters: [
        { id: "c1", slug: "link", name: "Link", primaryGame: "Zelda", gamesCount: 1 } as never,
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
    mockFetchPlayers.mockRejectedValue(new Error("DB connection lost"));

    const result = await GlobalSearchService.search(buildRequest());

    expect(result.games.local).toEqual([]);
    expect(result.games.igdb).toEqual([]);
    expect(result.characters).toHaveLength(1);
    expect(result.players).toEqual([]);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain("Games search failed");
    expect(result.errors[1]).toContain("Players search failed");
    expect(consoleSpy).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  });

  it("should handle all three sources failing gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockHybridSearch.mockRejectedValue(new Error("fail"));
    mockFetchCharacters.mockRejectedValue(new Error("fail"));
    mockFetchPlayers.mockRejectedValue(new Error("fail"));

    const result = await GlobalSearchService.search(buildRequest());

    expect(result.games.local).toEqual([]);
    expect(result.games.igdb).toEqual([]);
    expect(result.characters).toEqual([]);
    expect(result.players).toEqual([]);
    expect(result.errors).toHaveLength(3);

    consoleSpy.mockRestore();
  });

  it("should default locale to 'fr' when not provided", async () => {
    await GlobalSearchService.search({ query: "test" });

    expect(mockHybridSearch).toHaveBeenCalledWith(expect.objectContaining({ locale: "fr" }));
    expect(mockFetchCharacters).toHaveBeenCalledWith(expect.objectContaining({ locale: "fr" }));
  });
});

describe("GlobalSearchService.toGlobalSearchResponse", () => {
  function buildResult(
    overrides: Partial<{
      local: Parameters<typeof GlobalSearchService.toGlobalSearchResponse>[0]["games"]["local"];
      igdb: Parameters<typeof GlobalSearchService.toGlobalSearchResponse>[0]["games"]["igdb"];
      characters: Parameters<typeof GlobalSearchService.toGlobalSearchResponse>[0]["characters"];
      players: Parameters<typeof GlobalSearchService.toGlobalSearchResponse>[0]["players"];
    }> = {}
  ) {
    return {
      games: {
        local: overrides.local ?? [],
        igdb: overrides.igdb ?? [],
      },
      characters: overrides.characters ?? [],
      players: overrides.players ?? [],
      errors: [],
    };
  }

  it("should transform local GameSummary to GlobalSearchGameItem with source 'local'", () => {
    const result = buildResult({
      local: [
        {
          id: "g1",
          slug: "zelda-botw",
          title: "Zelda BOTW",
          coverImage: "/covers/zelda.jpg",
          developer: "Nintendo",
          publisher: "Nintendo",
          releaseYear: 2017,
          igdbId: 1234,
          genres: [{ name: "Action" }],
        },
      ],
    });

    const response = GlobalSearchService.toGlobalSearchResponse(result);

    expect(response.games).toHaveLength(1);
    expect(response.games[0]).toEqual({
      id: "g1",
      igdbId: 1234,
      slug: "zelda-botw",
      title: "Zelda BOTW",
      coverUrl: "/covers/zelda.jpg",
      developer: "Nintendo",
      releaseYear: 2017,
      source: "local",
    });
  });

  it("should transform IGDBSearchResult to GlobalSearchGameItem with source 'igdb'", () => {
    const result = buildResult({
      igdb: [
        {
          id: 5678,
          name: "Elden Ring",
          slug: "elden-ring",
          cover_url: "//images.igdb.com/elden.jpg",
          developer: "FromSoftware",
          release_year: 2022,
        },
      ],
    });

    const response = GlobalSearchService.toGlobalSearchResponse(result);

    expect(response.games).toHaveLength(1);
    expect(response.games[0]).toEqual({
      id: "5678",
      igdbId: 5678,
      slug: "elden-ring",
      title: "Elden Ring",
      coverUrl: "//images.igdb.com/elden.jpg",
      developer: "FromSoftware",
      releaseYear: 2022,
      source: "igdb",
    });
  });

  it("should combine local and IGDB games into a single array", () => {
    const result = buildResult({
      local: [
        {
          id: "g1",
          slug: "zelda",
          title: "Zelda",
          developer: "Nintendo",
          publisher: "Nintendo",
          genres: [],
        },
      ],
      igdb: [{ id: 99, name: "Mario", slug: "mario" }],
    });

    const response = GlobalSearchService.toGlobalSearchResponse(result);

    expect(response.games).toHaveLength(2);
    expect(response.games[0].source).toBe("local");
    expect(response.games[1].source).toBe("igdb");
  });

  it("should transform CharacterSummary to GlobalSearchCharacterItem", () => {
    const result = buildResult({
      characters: [
        {
          id: "c1",
          slug: "link",
          name: "Link",
          mainImage: "/chars/link.jpg",
          role: "Hero",
          primaryGame: "Zelda BOTW",
          gamesCount: 3,
        },
      ],
    });

    const response = GlobalSearchService.toGlobalSearchResponse(result);

    expect(response.characters).toHaveLength(1);
    expect(response.characters[0]).toEqual({
      id: "c1",
      slug: "link",
      name: "Link",
      mainImage: "/chars/link.jpg",
      role: "Hero",
      primaryGame: "Zelda BOTW",
    });
  });

  it("should transform PlayerSummary to GlobalSearchPlayerItem", () => {
    const result = buildResult({
      players: [
        {
          id: "p1",
          fullName: "GamerPro",
          avatarUrl: "/avatars/pro.jpg",
          gamesCount: 42,
          createdAt: "2024-01-01",
        },
      ],
    });

    const response = GlobalSearchService.toGlobalSearchResponse(result);

    expect(response.players).toHaveLength(1);
    expect(response.players[0]).toEqual({
      id: "p1",
      username: "GamerPro",
      avatarUrl: "/avatars/pro.jpg",
    });
  });

  it("should use player id as username fallback when fullName is null", () => {
    const result = buildResult({
      players: [
        {
          id: "p2",
          fullName: null,
          avatarUrl: null,
          gamesCount: 0,
          createdAt: "2024-01-01",
        },
      ],
    });

    const response = GlobalSearchService.toGlobalSearchResponse(result);

    expect(response.players[0].username).toBe("p2");
    expect(response.players[0].avatarUrl).toBeUndefined();
  });

  it("should compute counts from array lengths", () => {
    const result = buildResult({
      local: [
        { id: "g1", slug: "a", title: "A", developer: "", publisher: "", genres: [] },
        { id: "g2", slug: "b", title: "B", developer: "", publisher: "", genres: [] },
      ],
      igdb: [{ id: 1, name: "C", slug: "c" }],
      characters: [{ id: "c1", slug: "x", name: "X", primaryGame: "A", gamesCount: 1 }],
      players: [],
    });

    const response = GlobalSearchService.toGlobalSearchResponse(result);

    expect(response.counts).toEqual({
      games: 3,
      characters: 1,
      players: 0,
    });
  });

  it("should return empty arrays and zero counts for empty result", () => {
    const result = buildResult();

    const response = GlobalSearchService.toGlobalSearchResponse(result);

    expect(response.games).toEqual([]);
    expect(response.characters).toEqual([]);
    expect(response.players).toEqual([]);
    expect(response.counts).toEqual({ games: 0, characters: 0, players: 0 });
  });

  it("should handle optional fields gracefully", () => {
    const result = buildResult({
      local: [
        {
          id: "g1",
          slug: "minimal",
          title: "Minimal Game",
          developer: "",
          publisher: "",
          genres: [],
        },
      ],
      igdb: [{ id: 1, name: "Bare IGDB", slug: "bare" }],
      characters: [{ id: "c1", slug: "char", name: "Char", primaryGame: "Game", gamesCount: 1 }],
    });

    const response = GlobalSearchService.toGlobalSearchResponse(result);

    // Local game with empty developer should have undefined developer
    expect(response.games[0].coverUrl).toBeUndefined();
    expect(response.games[0].developer).toBeUndefined();
    expect(response.games[0].releaseYear).toBeUndefined();

    // IGDB game with no optional fields
    expect(response.games[1].coverUrl).toBeUndefined();
    expect(response.games[1].developer).toBeUndefined();
    expect(response.games[1].releaseYear).toBeUndefined();

    // Character with no optional fields
    expect(response.characters[0].mainImage).toBeUndefined();
    expect(response.characters[0].role).toBeUndefined();
  });
});
