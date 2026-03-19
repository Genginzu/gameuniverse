/**
 * Tests for platform filtering on games and characters routes.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

let mockSupabaseFrom: any;

vi.mock("../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (mockSupabaseFrom) return mockSupabaseFrom(table);
        return {};
      },
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
    }),
}));

function makeRequest(url: string) {
  return new Request(url) as unknown as import("next/server").NextRequest;
}

/** Helper: mock that resolves platform slugs → IDs */
function mockPlatformLookup(ids: string[]) {
  return {
    select: vi.fn(() => ({
      in: vi.fn(() => Promise.resolve({ data: ids.map((id) => ({ id })), error: null })),
    })),
  };
}

/** Helper: mock game_platforms returning game IDs for given platform IDs */
function mockGamePlatforms(gameIds: string[]) {
  return {
    select: vi.fn(() => ({
      in: vi.fn(() =>
        Promise.resolve({
          data: gameIds.map((game_id) => ({ game_id })),
          error: null,
        })
      ),
    })),
  };
}

function makeGameRow(id: string, slug: string, title: string): any {
  return {
    id,
    slug,
    igdb_id: null,
    cover_image_url: null,
    background_image_url: null,
    background_color: null,
    release_date: null,
    metascore: null,
    created_at: "2024-01-01",
    game_translations: [{ title, description: null, language_code: "fr" }],
    game_genres: [],
    game_companies: [],
  };
}

function makeCharacterRow(id: string, name: string, gameIds: string[]): any {
  return {
    id,
    slug: name.toLowerCase(),
    main_image: null,
    background_color: null,
    created_at: "2024-01-01",
    character_translations: [{ name, role: "hero", description: null }],
    character_games: gameIds.map((gid, i) => ({
      is_primary: i === 0,
      games: { id: gid, slug: gid, game_translations: [{ title: gid }] },
    })),
  };
}

function mockGamesTable(rows: any[], count: number) {
  return {
    select: vi.fn((_c: string, opts?: { head?: boolean }) => {
      if (opts?.head) {
        return { in: vi.fn(() => Promise.resolve({ count, error: null })) };
      }
      return {
        in: vi.fn(() => ({
          range: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: rows, error: null })),
          })),
        })),
      };
    }),
  };
}

function mockCharactersTable(rows: any[], count: number) {
  return {
    select: vi.fn((_c: string, opts?: { head?: boolean }) => {
      if (opts?.head) {
        return {
          eq: vi.fn(() => Promise.resolve({ count, error: null })),
        };
      }
      return {
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            range: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: rows, error: null })),
            })),
          })),
        })),
      };
    }),
  };
}

// =====================
// Games — platform filter (Req 4.1, 4.3, 4.4)
// =====================
describe("GET /api/games — platform filter", () => {
  beforeEach(() => {
    mockSupabaseFrom = null;
  });

  test("filters games by platform slugs", async () => {
    const { GET } = await import("../../../src/app/api/games/route");
    const game = makeGameRow("game-1", "zelda", "Zelda");

    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "platforms") return mockPlatformLookup(["plat-1"]);
      if (table === "game_platforms") return mockGamePlatforms(["game-1"]);
      if (table === "games") return mockGamesTable([game], 1);
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/games?platforms=ps5&locale=fr"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.games).toHaveLength(1);
    expect(body.filters.platforms).toEqual(["ps5"]);
  });

  test("returns empty when no games match platform", async () => {
    const { GET } = await import("../../../src/app/api/games/route");

    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "platforms") return mockPlatformLookup(["plat-1"]);
      if (table === "game_platforms") return mockGamePlatforms([]);
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/games?platforms=dreamcast&locale=fr"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.games).toEqual([]);
    expect(body.pagination.totalCount).toBe(0);
  });

  test("returns all games when no platform filter (Req 4.4)", async () => {
    const { GET } = await import("../../../src/app/api/games/route");
    const rows = [makeGameRow("g1", "a", "Game A"), makeGameRow("g2", "b", "Game B")];

    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "games") {
        return {
          select: vi.fn((_c: string, opts?: { head?: boolean }) => {
            if (opts?.head) {
              return Promise.resolve({ count: 2, error: null });
            }
            return {
              range: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: rows, error: null })),
              })),
            };
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/games?locale=fr"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.games).toHaveLength(2);
    expect(body.filters.platforms).toEqual([]);
  });
});

// =====================
// Characters — platform filter (Req 4.2)
// =====================
describe("GET /api/characters — platform filter", () => {
  beforeEach(() => {
    mockSupabaseFrom = null;
  });

  test("filters characters by platform", async () => {
    const { GET } = await import("../../../src/app/api/characters/route");
    const char = makeCharacterRow("char-1", "Link", ["game-1"]);

    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "characters") return mockCharactersTable([char], 1);
      if (table === "platforms") return mockPlatformLookup(["plat-1"]);
      if (table === "game_platforms") return mockGamePlatforms(["game-1"]);
      return {};
    });

    const res = await GET(
      makeRequest("http://localhost/api/characters?platforms=switch&locale=fr")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.characters).toHaveLength(1);
    expect(body.characters[0].name).toBe("Link");
  });

  test("excludes characters with no matching platform games", async () => {
    const { GET } = await import("../../../src/app/api/characters/route");
    const char = makeCharacterRow("char-1", "Link", ["game-99"]);

    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "characters") return mockCharactersTable([char], 1);
      if (table === "platforms") return mockPlatformLookup(["plat-1"]);
      // game_platforms returns a different game ID
      if (table === "game_platforms") return mockGamePlatforms(["game-other"]);
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/characters?platforms=xbox&locale=fr"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.characters).toHaveLength(0);
  });
});
