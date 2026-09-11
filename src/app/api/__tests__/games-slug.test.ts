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

const { GET } = await import("@/app/api/games/[slug]/route");

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
  mockSupabaseFrom = undefined;
});

const makeParams = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("GET /api/games/[slug]", () => {
  test("returns game data by slug", async () => {
    const gameData = {
      id: "g1",
      slug: "test-game",
      igdb_id: 123,
      last_synced_at: null,
      cover_image_url: null,
      background_image_url: null,
      background_color: null,
      accent_color: null,
      label_color: null,
      text_color: null,
      release_date: "2024-01-01",
      metascore: 85,
      system_requirements: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      game_translations: [
        { title: "Test Game", description: "A test", storyline: null, language_code: "en" },
      ],
      game_genres: [],
      game_companies: [],
      game_screenshots: [],
      game_artwork: [],
      game_videos: [],
      game_ratings: [],
      game_prices: [],
    };

    mockSupabaseFrom = (table: string) => {
      if (table === "games") return supaChain({ data: gameData, error: null });
      if (table === "game_languages") return supaChain({ data: [], error: null });
      if (table === "game_music") return supaChain({ data: null, error: null });
      if (table === "game_versions") return supaChain({ data: [], error: null });
      if (table === "game_dlc_extensions") return supaChain({ data: [], error: null });
      if (table === "game_similar_games") return supaChain({ data: [], error: null });
      if (table === "game_platforms") return supaChain({ data: [], error: null });
      return supaChain({ data: null, error: null });
    };

    const res = await GET(
      makeRequest("http://localhost/api/games/test-game"),
      makeParams("test-game")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBe("test-game");
    expect(body.title).toBe("Test Game");
  });

  test("returns 404 when game not found", async () => {
    mockSupabaseFrom = (table: string) => {
      if (table === "games") return supaChain({ data: null, error: { code: "PGRST116" } });
      return supaChain({ data: null, error: null });
    };

    const res = await GET(
      makeRequest("http://localhost/api/games/nonexistent"),
      makeParams("nonexistent")
    );
    expect(res.status).toBe(404);
  });

  test("returns 500 on database error", async () => {
    mockSupabaseFrom = (table: string) => {
      if (table === "games")
        return supaChain({ data: null, error: { code: "INTERNAL", message: "fail" } });
      return supaChain({ data: null, error: null });
    };

    const res = await GET(makeRequest("http://localhost/api/games/broken"), makeParams("broken"));
    expect(res.status).toBe(500);
  });
});
