/**
 * Tests for platform filtering on games and characters routes.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

let mockSupabaseFrom: any;
let mockSupabaseRpc: any;

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (mockSupabaseFrom) return mockSupabaseFrom(table);
        return {};
      },
      rpc: (...args: unknown[]) => {
        if (mockSupabaseRpc) return mockSupabaseRpc(...args);
        return Promise.resolve({ data: null, error: null });
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
  const countResult = Promise.resolve({ count, error: null });
  const dataResult = Promise.resolve({ data: rows, error: null });

  return {
    select: vi.fn((_c: string, opts?: { head?: boolean }) => {
      if (opts?.head) {
        // Count query: chain .eq()/.ilike()/.in() all return countResult (a Promise)
        // The route awaits the final result, so the last method in the chain must return a Promise
        const countChain: any = {};
        countChain.eq = vi.fn(() => countChain);
        countChain.ilike = vi.fn(() => countChain);
        countChain.in = vi.fn(() => countChain);
        // Make countChain itself thenable so `await countChain` resolves
        countChain.then = countResult.then.bind(countResult);
        countChain.catch = countResult.catch.bind(countResult);
        return countChain;
      }
      // Main query: chain .eq()/.ilike()/.in() then .order().order().order().range()
      const mainChain: any = {};
      mainChain.eq = vi.fn(() => mainChain);
      mainChain.ilike = vi.fn(() => mainChain);
      mainChain.in = vi.fn(() => mainChain);
      mainChain.order = vi.fn(() => mainChain);
      mainChain.range = vi.fn(() => dataResult);
      return mainChain;
    }),
  };
}

/** Helper: mock character_games returning character IDs for given game IDs */
function mockCharacterGames(characterIds: string[]) {
  return {
    select: vi.fn(() => ({
      in: vi.fn(() =>
        Promise.resolve({
          data: characterIds.map((character_id) => ({ character_id })),
          error: null,
        })
      ),
    })),
  };
}

// =====================
// Games — platform filter (Req 4.1, 4.3, 4.4)
// =====================
describe("GET /api/games — platform filter", () => {
  beforeEach(() => {
    mockSupabaseFrom = null;
    mockSupabaseRpc = null;
  });

  test("filters games by platform slugs", { timeout: 15000 }, async () => {
    const { GET } = await import("@/app/api/games/route");

    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "platforms") return mockPlatformLookup(["plat-1"]);
      if (table === "game_platforms") return mockGamePlatforms(["game-1"]);
      return {};
    });

    mockSupabaseRpc = vi.fn(() =>
      Promise.resolve({
        data: {
          games: [
            {
              id: "game-1",
              slug: "zelda",
              igdb_id: null,
              cover_image_url: null,
              background_image_url: null,
              background_color: null,
              release_date: null,
              metascore: null,
              created_at: "2024-01-01",
              title: "Zelda",
              description: null,
              genres: [],
              developer: "Unknown",
              publisher: "Unknown",
            },
          ],
          totalCount: 1,
        },
        error: null,
      })
    );

    const res = await GET(makeRequest("http://localhost/api/games?platforms=ps5&locale=fr"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.games).toHaveLength(1);
    expect(body.filters.platforms).toEqual(["ps5"]);
  });

  test("returns empty when no games match platform", async () => {
    const { GET } = await import("@/app/api/games/route");

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
    const { GET } = await import("@/app/api/games/route");

    mockSupabaseRpc = vi.fn(() =>
      Promise.resolve({
        data: {
          games: [
            {
              id: "g1",
              slug: "a",
              igdb_id: null,
              cover_image_url: null,
              background_image_url: null,
              background_color: null,
              release_date: null,
              metascore: null,
              created_at: "2024-01-01",
              title: "Game A",
              description: null,
              genres: [],
              developer: "Unknown",
              publisher: "Unknown",
            },
            {
              id: "g2",
              slug: "b",
              igdb_id: null,
              cover_image_url: null,
              background_image_url: null,
              background_color: null,
              release_date: null,
              metascore: null,
              created_at: "2024-01-01",
              title: "Game B",
              description: null,
              genres: [],
              developer: "Unknown",
              publisher: "Unknown",
            },
          ],
          totalCount: 2,
        },
        error: null,
      })
    );

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
    const { GET } = await import("@/app/api/characters/route");
    const char = makeCharacterRow("char-1", "Link", ["game-1"]);

    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "characters") return mockCharactersTable([char], 1);
      if (table === "platforms") return mockPlatformLookup(["plat-1"]);
      if (table === "game_platforms") return mockGamePlatforms(["game-1"]);
      if (table === "character_games") return mockCharacterGames(["char-1"]);
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
    const { GET } = await import("@/app/api/characters/route");

    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "characters") return mockCharactersTable([], 0);
      if (table === "platforms") return mockPlatformLookup(["plat-1"]);
      // game_platforms returns a different game ID than any character's games
      if (table === "game_platforms") return mockGamePlatforms(["game-other"]);
      // No characters have games matching "game-other"
      if (table === "character_games") return mockCharacterGames([]);
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/characters?platforms=xbox&locale=fr"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.characters).toHaveLength(0);
  });
});
