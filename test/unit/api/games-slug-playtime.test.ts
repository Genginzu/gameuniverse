import { describe, test, expect, beforeEach, vi } from "vitest";

let mockSupabaseFrom: any;
let mockGetUser: any;

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (t: string) => mockSupabaseFrom?.(t) ?? {},
      auth: {
        getUser: () =>
          mockGetUser
            ? mockGetUser()
            : Promise.resolve({ data: { user: null }, error: null }),
      },
    }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/services/achievementEngine", () => ({
  AchievementEngine: { evaluate: vi.fn(() => Promise.resolve()) },
}));

const { GET, POST } = await import("@/app/api/games/[slug]/playtime/route");

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as any;
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
  mockGetUser = undefined;
});

describe("GET /api/games/[slug]/playtime", () => {
  test("returns playtime data", async () => {
    mockGetUser = () =>
      Promise.resolve({ data: { user: { id: "u1" } }, error: null });

    mockSupabaseFrom = (table: string) => {
      if (table === "games")
        return singleChain({ data: { id: "g1" }, error: null });
      if (table === "user_library")
        return supaChain({ data: [], error: null });
      if (table === "profiles")
        return supaChain({ data: [], error: null });
      return supaChain({ data: null, error: null });
    };

    const res = await GET(
      makeRequest("http://localhost/api/games/test-game/playtime"),
      makeParams("test-game")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("averages");
    expect(body).toHaveProperty("count");
    expect(body).toHaveProperty("contributors");
  });

  test("returns 404 when game not found", async () => {
    mockGetUser = () =>
      Promise.resolve({ data: { user: null }, error: null });

    mockSupabaseFrom = (table: string) => {
      if (table === "games")
        return singleChain({ data: null, error: { code: "PGRST116" } });
      return supaChain({ data: null, error: null });
    };

    const res = await GET(
      makeRequest("http://localhost/api/games/nonexistent/playtime"),
      makeParams("nonexistent")
    );
    expect(res.status).toBe(404);
  });
});

describe("POST /api/games/[slug]/playtime", () => {
  test("returns 401 when not authenticated", async () => {
    mockGetUser = () =>
      Promise.resolve({ data: { user: null }, error: { message: "no auth" } });

    const res = await POST(
      makeRequest("http://localhost/api/games/test-game/playtime", {
        method: "POST",
        body: JSON.stringify({ playTimeNormally: 10 }),
      }),
      makeParams("test-game")
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });
});
