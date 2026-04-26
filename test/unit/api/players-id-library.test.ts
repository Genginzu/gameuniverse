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

const { GET } = await import("@/app/api/players/[id]/library/route");

function makeRequest(url: string) {
  return new Request(url) as any;
}

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

function libraryFromMock(opts: { count: number | null; data: any[] | null; error?: any }) {
  return {
    select: (_cols: string, selectOpts?: { count?: string; head?: boolean }) => {
      const chain: any = {
        eq: () => chain,
        order: () => chain,
        range: () => Promise.resolve({ data: opts.data, error: opts.error ?? null }),
      };
      if (selectOpts?.head) {
        return {
          eq: () => Promise.resolve({ count: opts.count, error: opts.error ?? null }),
        };
      }
      return chain;
    },
  };
}

beforeEach(() => {
  mockSupabaseFrom = undefined;
});

describe("GET /api/players/[id]/library", () => {
  test("returns library games with pagination", async () => {
    const libraryEntry = {
      id: "lib1",
      game_id: "g1",
      status: "playing",
      play_time_hastily: null,
      play_time_normally: 10,
      play_time_completely: null,
      rating: 80,
      added_at: "2024-01-01",
      games: {
        id: "g1",
        slug: "test-game",
        cover_image_url: null,
        game_translations: [{ title: "Test Game", language_code: "fr" }],
      },
    };

    mockSupabaseFrom = (table: string) => {
      if (table === "user_library") return libraryFromMock({ count: 1, data: [libraryEntry] });
      return {};
    };

    const res = await GET(makeRequest("http://localhost/api/players/u1/library"), makeParams("u1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("games");
    expect(body).toHaveProperty("pagination");
    expect(body.games[0].slug).toBe("test-game");
    expect(body.pagination.totalCount).toBe(1);
  });

  test("returns 500 when database query fails", async () => {
    mockSupabaseFrom = (table: string) => {
      if (table === "user_library")
        return libraryFromMock({ count: 0, data: null, error: { message: "DB error" } });
      return {};
    };

    const res = await GET(makeRequest("http://localhost/api/players/u1/library"), makeParams("u1"));
    expect(res.status).toBe(500);
  });

  test("returns empty games when player has no library entries", async () => {
    mockSupabaseFrom = (table: string) => {
      if (table === "user_library") return libraryFromMock({ count: 0, data: [] });
      return {};
    };

    const res = await GET(makeRequest("http://localhost/api/players/u1/library"), makeParams("u1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.games).toHaveLength(0);
    expect(body.pagination.totalCount).toBe(0);
  });
});
