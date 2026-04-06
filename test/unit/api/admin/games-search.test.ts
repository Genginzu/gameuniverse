import { describe, test, expect, beforeEach, vi } from "vitest";

let mockRequireAdmin: any;
let mockSupabaseFrom: any;

vi.mock("../../../../src/lib/auth-admin", () => ({
  requireAdmin: () =>
    mockRequireAdmin ? mockRequireAdmin() : Promise.resolve(true),
}));

vi.mock("../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (t: string) => mockSupabaseFrom?.(t) ?? {},
    }),
}));

vi.mock("../../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { GET } = await import(
  "../../../../src/app/api/admin/games/search/route"
);

function makeRequest(url: string) {
  return new Request(url) as any;
}

function supaChain(result: { data?: any; error?: any }) {
  const c: any = new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === "then") return (resolve: any) => resolve(result);
        return () => c;
      },
    }
  );
  return c;
}

beforeEach(() => {
  mockRequireAdmin = undefined;
  mockSupabaseFrom = undefined;
});

describe("GET /api/admin/games/search", () => {
  test("returns empty array when query < 2 chars", async () => {
    const res = await GET(makeRequest("http://localhost/api/admin/games/search?q=a"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test("returns matching games with title, id, slug, coverImage", async () => {
    mockSupabaseFrom = (table: string) => {
      if (table === "game_translations") {
        return supaChain({
          data: [{ game_id: "g1", title: "Zelda", language_code: "fr" }],
          error: null,
        });
      }
      if (table === "games") {
        return supaChain({
          data: [{ id: "g1", slug: "zelda", cover_image_url: "https://img.com/z.jpg" }],
          error: null,
        });
      }
      return supaChain({ data: [], error: null });
    };

    const res = await GET(makeRequest("http://localhost/api/admin/games/search?q=zel&locale=fr"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0]).toEqual({
      id: "g1",
      slug: "zelda",
      title: "Zelda",
      coverImage: "https://img.com/z.jpg",
    });
  });

  test("returns empty array when no matches", async () => {
    mockSupabaseFrom = () => supaChain({ data: [], error: null });

    const res = await GET(makeRequest("http://localhost/api/admin/games/search?q=nonexistent"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test("returns empty array (200) on error (catch returns [])", async () => {
    mockSupabaseFrom = () => {
      throw new Error("DB error");
    };

    const res = await GET(makeRequest("http://localhost/api/admin/games/search?q=test"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test("returns empty array (200) when requireAdmin throws", async () => {
    mockRequireAdmin = () => {
      throw new Error("Admin access required");
    };

    const res = await GET(makeRequest("http://localhost/api/admin/games/search?q=test"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
