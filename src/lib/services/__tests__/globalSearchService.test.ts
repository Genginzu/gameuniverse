import { describe, it, expect, vi, beforeEach } from "vitest";
import { GlobalSearchService } from "@/lib/services/globalSearchService";
import { HybridSearchService } from "@/lib/services/hybridSearchService";
import { CharacterService } from "@/lib/services/characterService";
import { PlayerService } from "@/lib/services/playerService";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { GlobalSearchRequest, GlobalSearchResult } from "@/types/global-search";

vi.mock("@/lib/services/hybridSearchService");
vi.mock("@/lib/services/characterService");
vi.mock("@/lib/services/playerService");
vi.mock("@/lib/supabase-admin");

const mockHybridSearch = vi.mocked(HybridSearchService.search);
const mockFetchCharacters = vi.mocked(CharacterService.fetchCharacters);
const mockFetchPlayers = vi.mocked(PlayerService.fetchPlayersFromDB);
const mockGetSupabaseAdmin = vi.mocked(getSupabaseAdmin);

// ============================================================================
// Supabase mock builder
// ============================================================================

/**
 * Builds a chainable Supabase query mock that resolves to `data` (or rejects
 * with `error`). Records the path of methods called for assertions.
 */
function makeSupabaseMock(handlers: {
  esport_teams?: { data?: unknown; error?: unknown };
  esport_players?: { data?: unknown; error?: unknown };
  profiles?: { data?: unknown; error?: unknown };
  coach_profiles?: { data?: unknown; error?: unknown };
}) {
  function chain(table: keyof typeof handlers) {
    const { data = [], error = null } = handlers[table] ?? {};
    const builder: Record<string, unknown> = {
      select: vi.fn(() => builder),
      ilike: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      order: vi.fn(() => builder),
      limit: vi.fn(() => Promise.resolve({ data, error })),
      then: (resolve: (v: { data: unknown; error: unknown }) => unknown) =>
        Promise.resolve({ data, error }).then(resolve),
    };
    return builder;
  }
  return {
    from: vi.fn((table: string) => chain(table as keyof typeof handlers)),
  };
}

// ============================================================================
// Helpers
// ============================================================================

function buildRequest(overrides: Partial<GlobalSearchRequest> = {}): GlobalSearchRequest {
  return { query: "zelda", locale: "fr", ...overrides };
}

function setupServiceMocks() {
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
  // Default Supabase: empty results for every table
  mockGetSupabaseAdmin.mockReturnValue(
    makeSupabaseMock({
      esport_teams: { data: [] },
      esport_players: { data: [] },
      profiles: { data: [] },
      coach_profiles: { data: [] },
    }) as never
  );
}

// ============================================================================
// search() — orchestration of 6 sources
// ============================================================================

describe("GlobalSearchService.search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupServiceMocks();
  });

  it("executes the existing 3 services in parallel", async () => {
    await GlobalSearchService.search(buildRequest());
    expect(mockHybridSearch).toHaveBeenCalledOnce();
    expect(mockFetchCharacters).toHaveBeenCalledOnce();
    expect(mockFetchPlayers).toHaveBeenCalledOnce();
  });

  it("queries the 3 new entity tables (esport_teams, esport_players, profiles+coach_profiles)", async () => {
    const sb = makeSupabaseMock({
      esport_teams: { data: [] },
      esport_players: { data: [] },
      profiles: { data: [{ id: "player-uuid" }] }, // non-empty so the 2nd-step query runs
      coach_profiles: { data: [] },
    });
    mockGetSupabaseAdmin.mockReturnValue(sb as never);

    await GlobalSearchService.search(buildRequest());

    const fromCalls = (sb.from as unknown as { mock: { calls: [string][] } }).mock.calls.map(
      ([t]) => t
    );
    expect(fromCalls).toContain("esport_teams");
    expect(fromCalls).toContain("esport_players");
    // Coaches require a 2-step query: profiles → coach_profiles
    expect(fromCalls).toContain("profiles");
    expect(fromCalls).toContain("coach_profiles");
  });

  it("passes correct parameters to each service", async () => {
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
      igdbLimit: 499,
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

  it("uses default limit of 5 when not specified", async () => {
    await GlobalSearchService.search(buildRequest({ query: "test" }));
    expect(mockHybridSearch).toHaveBeenCalledWith(
      expect.objectContaining({ localLimit: 10000, igdbLimit: 499 })
    );
    expect(mockFetchCharacters).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
    expect(mockFetchPlayers).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
  });

  it("returns results from all 6 sources when all succeed", async () => {
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
    mockGetSupabaseAdmin.mockReturnValue(
      makeSupabaseMock({
        esport_teams: {
          data: [
            {
              id: "t-uuid",
              pandascore_id: 100,
              name: "G2",
              slug: "g2",
              acronym: null,
              image_url: null,
              location: null,
              game: "lol",
            },
          ],
        },
        esport_players: {
          data: [
            {
              id: "pp-uuid",
              pandascore_id: 200,
              name: "Caps",
              slug: "caps",
              first_name: null,
              last_name: null,
              nationality: null,
              image_url: null,
              role: null,
              game: "lol",
              esport_teams: { name: "G2" },
            },
          ],
        },
        profiles: { data: [{ id: "player-uuid" }] },
        coach_profiles: {
          data: [
            {
              id: "coach-uuid",
              is_verified: true,
              average_rating: 4.7,
              total_reviews: 42,
              profiles: { username: "topcoach", avatar_url: "/a.jpg" },
            },
          ],
        },
      }) as never
    );

    const result = await GlobalSearchService.search(buildRequest());

    expect(result.games.local).toHaveLength(1);
    expect(result.games.igdb).toHaveLength(1);
    expect(result.characters).toHaveLength(1);
    expect(result.players).toHaveLength(1);
    expect(result.teams).toHaveLength(1);
    expect(result.proPlayers).toHaveLength(1);
    expect(result.coaches).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("preserves tolerance: when one source fails, the others still return", async () => {
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

    const result = await GlobalSearchService.search(buildRequest());

    expect(result.games.local).toEqual([]);
    expect(result.games.igdb).toEqual([]);
    expect(result.characters).toHaveLength(1);
    expect(result.errors.some((e) => e.includes("Games search failed"))).toBe(true);

    consoleSpy.mockRestore();
  });

  it("preserves tolerance for the 3 new sources: a failing one does not break the others", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // teams query throws, but proPlayers and coaches return
    mockGetSupabaseAdmin.mockImplementation(
      () =>
        ({
          from: vi.fn((table: string) => {
            if (table === "esport_teams") {
              return {
                select: vi.fn().mockReturnThis(),
                ilike: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } })),
              };
            }
            if (table === "esport_players") {
              return {
                select: vi.fn().mockReturnThis(),
                ilike: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      {
                        id: "pp-uuid",
                        pandascore_id: 7,
                        name: "Faker",
                        slug: "faker",
                        first_name: null,
                        last_name: null,
                        nationality: null,
                        image_url: null,
                        role: null,
                        game: "lol",
                        esport_teams: null,
                      },
                    ],
                    error: null,
                  })
                ),
              };
            }
            if (table === "profiles") {
              return {
                select: vi.fn().mockReturnThis(),
                ilike: vi.fn().mockReturnThis(),
                limit: vi.fn(() => Promise.resolve({ data: [{ id: "player-uuid" }], error: null })),
              };
            }
            if (table === "coach_profiles") {
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      {
                        id: "coach-uuid",
                        is_verified: false,
                        average_rating: 0,
                        total_reviews: 0,
                        profiles: { username: "u", avatar_url: null },
                      },
                    ],
                    error: null,
                  })
                ),
              };
            }
            return {
              select: vi.fn().mockReturnThis(),
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            };
          }),
        }) as never
    );

    const result = await GlobalSearchService.search(buildRequest());

    expect(result.teams).toEqual([]);
    expect(result.proPlayers).toHaveLength(1);
    expect(result.coaches).toHaveLength(1);
    expect(result.errors.some((e) => e.includes("Teams search failed"))).toBe(true);

    consoleSpy.mockRestore();
  });

  it("defaults locale to 'fr' when not provided", async () => {
    await GlobalSearchService.search({ query: "test" });
    expect(mockHybridSearch).toHaveBeenCalledWith(expect.objectContaining({ locale: "fr" }));
    expect(mockFetchCharacters).toHaveBeenCalledWith(expect.objectContaining({ locale: "fr" }));
  });
});

// ============================================================================
// New private methods (searchTeams / searchProPlayers / searchCoaches)
// ============================================================================

describe("GlobalSearchService — esport teams search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupServiceMocks();
  });

  it("filters out teams without a pandascore_id (no route possible)", async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      makeSupabaseMock({
        esport_teams: {
          data: [
            {
              id: "uuid-1",
              pandascore_id: 100,
              name: "G2",
              slug: "g2",
              acronym: "G2",
              image_url: "/g2.png",
              location: "EU",
              game: "lol",
            },
            // This one has no pandascore_id — must be dropped
            {
              id: "uuid-2",
              pandascore_id: null,
              name: "Imported Team",
              slug: "imported",
              acronym: null,
              image_url: null,
              location: null,
              game: "lol",
            },
          ],
        },
      }) as never
    );

    const result = await GlobalSearchService.search(buildRequest());

    expect(result.teams).toHaveLength(1);
    expect(result.teams[0]).toEqual({
      id: 100,
      name: "G2",
      slug: "g2",
      acronym: "G2",
      imageUrl: "/g2.png",
      location: "EU",
      game: "lol",
    });
  });

  it("returns an empty array for an empty (whitespace) query", async () => {
    const result = await GlobalSearchService.search({ query: "   ", locale: "fr" });
    // The service short-circuits on whitespace queries before hitting Supabase
    expect(result.teams).toEqual([]);
  });
});

describe("GlobalSearchService — esport pro players search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupServiceMocks();
  });

  it("normalizes the joined team name (object form)", async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      makeSupabaseMock({
        esport_players: {
          data: [
            {
              id: "uuid-1",
              pandascore_id: 9999,
              name: "Caps",
              slug: "caps",
              first_name: "Rasmus",
              last_name: "Winther",
              nationality: "DK",
              image_url: "/caps.png",
              role: "Mid",
              game: "lol",
              esport_teams: { name: "G2 Esports" },
            },
          ],
        },
      }) as never
    );

    const result = await GlobalSearchService.search(buildRequest());

    expect(result.proPlayers).toHaveLength(1);
    expect(result.proPlayers[0]).toEqual({
      id: 9999,
      name: "Caps",
      slug: "caps",
      firstName: "Rasmus",
      lastName: "Winther",
      nationality: "DK",
      imageUrl: "/caps.png",
      role: "Mid",
      game: "lol",
      teamName: "G2 Esports",
    });
  });

  it("normalizes the joined team name (array form returned by Supabase)", async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      makeSupabaseMock({
        esport_players: {
          data: [
            {
              id: "uuid-1",
              pandascore_id: 1,
              name: "Faker",
              slug: "faker",
              first_name: null,
              last_name: null,
              nationality: null,
              image_url: null,
              role: null,
              game: null,
              esport_teams: [{ name: "T1" }],
            },
          ],
        },
      }) as never
    );

    const result = await GlobalSearchService.search(buildRequest());
    expect(result.proPlayers[0].teamName).toBe("T1");
  });

  it("filters out pro players without a pandascore_id", async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      makeSupabaseMock({
        esport_players: {
          data: [
            {
              id: "uuid-1",
              pandascore_id: null,
              name: "Imported",
              slug: "imp",
              first_name: null,
              last_name: null,
              nationality: null,
              image_url: null,
              role: null,
              game: null,
              esport_teams: null,
            },
          ],
        },
      }) as never
    );

    const result = await GlobalSearchService.search(buildRequest());
    expect(result.proPlayers).toEqual([]);
  });
});

describe("GlobalSearchService — coaches search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupServiceMocks();
  });

  it("returns empty when no profile usernames match (skips the coach_profiles query)", async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      makeSupabaseMock({
        profiles: { data: [] },
        // coach_profiles intentionally not configured — must not be queried
      }) as never
    );

    const result = await GlobalSearchService.search(buildRequest());
    expect(result.coaches).toEqual([]);
  });

  it("filters out coaches without a username", async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      makeSupabaseMock({
        profiles: { data: [{ id: "p1" }, { id: "p2" }] },
        coach_profiles: {
          data: [
            {
              id: "c1",
              is_verified: true,
              average_rating: 4.5,
              total_reviews: 10,
              profiles: { username: "alice", avatar_url: "/a.png" },
            },
            {
              id: "c2",
              is_verified: false,
              average_rating: null,
              total_reviews: null,
              profiles: { username: null, avatar_url: null },
            },
          ],
        },
      }) as never
    );

    const result = await GlobalSearchService.search(buildRequest());

    expect(result.coaches).toHaveLength(1);
    expect(result.coaches[0]).toEqual({
      id: "c1",
      username: "alice",
      avatarUrl: "/a.png",
      averageRating: 4.5,
      totalReviews: 10,
      isVerified: true,
    });
  });

  it("coerces null average_rating / total_reviews to 0", async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      makeSupabaseMock({
        profiles: { data: [{ id: "p1" }] },
        coach_profiles: {
          data: [
            {
              id: "c1",
              is_verified: false,
              average_rating: null,
              total_reviews: null,
              profiles: { username: "freshcoach", avatar_url: null },
            },
          ],
        },
      }) as never
    );

    const result = await GlobalSearchService.search(buildRequest());

    expect(result.coaches[0].averageRating).toBe(0);
    expect(result.coaches[0].totalReviews).toBe(0);
    expect(result.coaches[0].avatarUrl).toBeUndefined();
  });

  it("normalizes the joined profile (array form)", async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      makeSupabaseMock({
        profiles: { data: [{ id: "p1" }] },
        coach_profiles: {
          data: [
            {
              id: "c1",
              is_verified: true,
              average_rating: 5,
              total_reviews: 3,
              profiles: [{ username: "arrayform", avatar_url: null }],
            },
          ],
        },
      }) as never
    );

    const result = await GlobalSearchService.search(buildRequest());
    expect(result.coaches[0].username).toBe("arrayform");
  });
});

// ============================================================================
// toGlobalSearchResponse — extended for 6 groups
// ============================================================================

describe("GlobalSearchService.toGlobalSearchResponse", () => {
  function buildResult(overrides: Partial<GlobalSearchResult> = {}): GlobalSearchResult {
    return {
      games: { local: [], igdb: [] },
      characters: [],
      players: [],
      teams: [],
      proPlayers: [],
      coaches: [],
      errors: [],
      ...overrides,
    };
  }

  it("returns 6 empty arrays and zero counts for an empty result", () => {
    const response = GlobalSearchService.toGlobalSearchResponse(buildResult());

    expect(response.games).toEqual([]);
    expect(response.characters).toEqual([]);
    expect(response.players).toEqual([]);
    expect(response.teams).toEqual([]);
    expect(response.proPlayers).toEqual([]);
    expect(response.coaches).toEqual([]);

    expect(response.counts).toEqual({
      games: 0,
      characters: 0,
      players: 0,
      teams: 0,
      proPlayers: 0,
      coaches: 0,
    });
  });

  it("transforms local games to GlobalSearchGameItem with source 'local'", () => {
    const result = buildResult({
      games: {
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
        ] as never,
        igdb: [],
      },
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

  it("transforms IGDB games to GlobalSearchGameItem with source 'igdb'", () => {
    const result = buildResult({
      games: {
        local: [],
        igdb: [
          {
            id: 5678,
            name: "Elden Ring",
            slug: "elden-ring",
            cover_url: "//images.igdb.com/elden.jpg",
            developer: "FromSoftware",
            release_year: 2022,
          },
        ] as never,
      },
    });

    const response = GlobalSearchService.toGlobalSearchResponse(result);

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

  it("uses player id as username fallback when fullName is null", () => {
    const result = buildResult({
      players: [
        {
          id: "p2",
          fullName: null,
          avatarUrl: null,
          gamesCount: 0,
          level: 1,
          socialLinks: {},
          reviewCount: 0,
          createdAt: "2024-01-01",
        } as never,
      ],
    });

    const response = GlobalSearchService.toGlobalSearchResponse(result);
    expect(response.players[0].username).toBe("p2");
  });

  it("passes teams / proPlayers / coaches through unchanged (already mapped)", () => {
    const result = buildResult({
      teams: [{ id: 100, name: "Team Liquid", slug: "team-liquid" }],
      proPlayers: [{ id: 200, name: "Caps", slug: "caps" }],
      coaches: [
        {
          id: "c1",
          username: "topcoach",
          averageRating: 4.5,
          totalReviews: 12,
          isVerified: true,
        },
      ],
    });

    const response = GlobalSearchService.toGlobalSearchResponse(result);

    expect(response.teams).toEqual([{ id: 100, name: "Team Liquid", slug: "team-liquid" }]);
    expect(response.proPlayers).toEqual([{ id: 200, name: "Caps", slug: "caps" }]);
    expect(response.coaches[0].username).toBe("topcoach");
  });

  it("computes counts from the 6 array lengths", () => {
    const result = buildResult({
      games: {
        local: [
          { id: "g1", slug: "a", title: "A", developer: "", publisher: "", genres: [] },
        ] as never,
        igdb: [{ id: 1, name: "B", slug: "b" }] as never,
      },
      characters: [{ id: "c1", slug: "x", name: "X", primaryGame: "A", gamesCount: 1 } as never],
      teams: [{ id: 100, name: "T", slug: "t" }],
      proPlayers: [
        { id: 200, name: "P", slug: "p" },
        { id: 201, name: "Q", slug: "q" },
      ],
      coaches: [
        { id: "c1", username: "u", averageRating: 0, totalReviews: 0, isVerified: false },
      ],
    });

    const response = GlobalSearchService.toGlobalSearchResponse(result);

    expect(response.counts).toEqual({
      games: 2,
      characters: 1,
      players: 0,
      teams: 1,
      proPlayers: 2,
      coaches: 1,
    });
  });
});
