import { describe, test, expect, beforeEach, vi } from "vitest";

let mockSupabaseFrom: any;

vi.mock("../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (mockSupabaseFrom) return mockSupabaseFrom(table);
        return {};
      },
    }),
}));

vi.mock("../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { GET } = await import("../../../src/app/api/genres/route");

function makeRequest(url: string) {
  return new Request(url) as unknown as import("next/server").NextRequest;
}

describe("GET /api/genres", () => {
  beforeEach(() => {
    mockSupabaseFrom = null;
  });

  test("returns genres with translations and game counts", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "genres") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                data: [
                  {
                    id: "g1",
                    slug: "rpg",
                    created_at: "2024-01-01",
                    genre_translations: [{ name: "RPG", description: "Role playing" }],
                  },
                  {
                    id: "g2",
                    slug: "action",
                    created_at: "2024-01-02",
                    genre_translations: [{ name: "Action", description: null }],
                  },
                ],
                error: null,
              })
            ),
          })),
        };
      }
      if (table === "game_genres") {
        return {
          select: vi.fn(() =>
            Promise.resolve({
              data: [{ genre_id: "g1" }, { genre_id: "g1" }, { genre_id: "g2" }],
              error: null,
            })
          ),
        };
      }
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/genres?locale=en"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.genres).toHaveLength(2);
    // Sorted by name: Action < RPG
    expect(body.genres[0].name).toBe("Action");
    expect(body.genres[0].gameCount).toBe(1);
    expect(body.genres[1].name).toBe("RPG");
    expect(body.genres[1].gameCount).toBe(2);
    expect(body.locale).toBe("en");
  });

  test("returns empty array when no genres", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "genres") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      }
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/genres"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.genres).toEqual([]);
    expect(body.locale).toBe("fr");
  });

  test("returns 500 on supabase error", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "genres") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: { message: "DB error" } })),
          })),
        };
      }
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/genres"));
    expect(res.status).toBe(500);
  });

  test("uses locale from query param", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "genres") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                data: [
                  {
                    id: "g1",
                    slug: "rpg",
                    created_at: "2024-01-01",
                    genre_translations: [{ name: "Jeu de rôle", description: null }],
                  },
                ],
                error: null,
              })
            ),
          })),
        };
      }
      if (table === "game_genres") {
        return {
          select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        };
      }
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/genres?locale=fr"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.locale).toBe("fr");
    expect(body.genres[0].name).toBe("Jeu de rôle");
  });
});
