import { describe, test, expect, beforeEach, vi } from "vitest";

let mockSupabaseFrom: any;

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (t: string) => mockSupabaseFrom?.(t) ?? {},
    }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/services/igdb-sync", () => ({
  syncAllGameFields: vi.fn(() => Promise.resolve({ success: true, syncedFields: [] })),
}));

const { POST } = await import("@/app/api/games/[slug]/sync/route");

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, { method: "POST", ...init }) as any;
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

function singleChain(result: { data?: any; error?: any }) {
  return {
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve(result),
      }),
    }),
  };
}

const makeParams = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  mockSupabaseFrom = undefined;
});

describe("POST /api/games/[slug]/sync", () => {
  test("returns 202 accepted when sync initiated", async () => {
    mockSupabaseFrom = (table: string) => {
      if (table === "games") return singleChain({ data: { id: "g1", igdb_id: 123 }, error: null });
      if (table === "game_field_overrides") return supaChain({ data: [], error: null });
      return supaChain({ data: null, error: null });
    };

    const res = await POST(
      makeRequest("http://localhost/api/games/test-game/sync"),
      makeParams("test-game")
    );
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe("Sync initiated");
  });

  test("returns 404 when game not found", async () => {
    mockSupabaseFrom = (table: string) => {
      if (table === "games") return singleChain({ data: null, error: { code: "PGRST116" } });
      return supaChain({ data: null, error: null });
    };

    const res = await POST(
      makeRequest("http://localhost/api/games/nonexistent/sync"),
      makeParams("nonexistent")
    );
    expect(res.status).toBe(404);
  });

  test("returns 400 when game has no IGDB ID", async () => {
    mockSupabaseFrom = (table: string) => {
      if (table === "games") return singleChain({ data: { id: "g1", igdb_id: null }, error: null });
      return supaChain({ data: null, error: null });
    };

    const res = await POST(
      makeRequest("http://localhost/api/games/no-igdb/sync"),
      makeParams("no-igdb")
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("no IGDB ID");
  });

  test("returns 500 on fetch error", async () => {
    mockSupabaseFrom = (table: string) => {
      if (table === "games")
        return singleChain({ data: null, error: { code: "INTERNAL", message: "fail" } });
      return supaChain({ data: null, error: null });
    };

    const res = await POST(
      makeRequest("http://localhost/api/games/broken/sync"),
      makeParams("broken")
    );
    expect(res.status).toBe(500);
  });
});
