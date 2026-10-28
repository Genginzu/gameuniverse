import { describe, test, expect, beforeEach, vi } from "vitest";

let mockSupabaseFrom: any;
let mockCounts: { data: unknown; error: unknown };

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (mockSupabaseFrom) return mockSupabaseFrom(table);
        return {};
      },
      rpc: vi.fn(() => Promise.resolve(mockCounts)),
    }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { GET } = await import("@/app/api/genres/route");

function makeRequest(url: string) {
  return new Request(url) as unknown as import("next/server").NextRequest;
}

function genresTable(data: unknown, error: unknown = null) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data, error })),
    })),
  };
}

describe("GET /api/genres", () => {
  beforeEach(() => {
    mockSupabaseFrom = null;
    mockCounts = { data: [], error: null };
  });

  test("returns genres with translations and the SQL game counts", async () => {
    mockSupabaseFrom = vi.fn(() =>
      genresTable([
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
      ])
    );
    mockCounts = {
      data: [
        { facet: "genre", ref_id: "g1", game_count: 1520 },
        { facet: "genre", ref_id: "g2", game_count: 3 },
        { facet: "platform", ref_id: "g2", game_count: 99 },
      ],
      error: null,
    };

    const res = await GET(makeRequest("http://localhost/api/genres?locale=en"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.genres).toHaveLength(2);
    expect(body.genres[0].name).toBe("Action");
    expect(body.genres[0].gameCount).toBe(3);
    expect(body.genres[1].name).toBe("RPG");
    expect(body.genres[1].gameCount).toBe(1520);
    expect(body.locale).toBe("en");
  });

  test("falls back to zero counts when the counts RPC fails", async () => {
    mockSupabaseFrom = vi.fn(() =>
      genresTable([
        { id: "g1", slug: "rpg", created_at: null, genre_translations: [{ name: "RPG" }] },
      ])
    );
    mockCounts = { data: null, error: { message: "rpc error" } };

    const res = await GET(makeRequest("http://localhost/api/genres"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.genres[0].gameCount).toBe(0);
  });

  test("returns empty array when no genres", async () => {
    mockSupabaseFrom = vi.fn(() => genresTable([]));

    const res = await GET(makeRequest("http://localhost/api/genres"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.genres).toEqual([]);
    expect(body.locale).toBe("fr");
  });

  test("returns 500 on supabase error", async () => {
    mockSupabaseFrom = vi.fn(() => genresTable(null, { message: "DB error" }));

    const res = await GET(makeRequest("http://localhost/api/genres"));
    expect(res.status).toBe(500);
  });

  test("uses locale from query param", async () => {
    mockSupabaseFrom = vi.fn(() =>
      genresTable([
        {
          id: "g1",
          slug: "rpg",
          created_at: "2024-01-01",
          genre_translations: [{ name: "Jeu de rôle", description: null }],
        },
      ])
    );

    const res = await GET(makeRequest("http://localhost/api/genres?locale=fr"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.locale).toBe("fr");
    expect(body.genres[0].name).toBe("Jeu de rôle");
  });
});
