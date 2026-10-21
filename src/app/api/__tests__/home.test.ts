import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const mock = createSupabaseQueryMock();

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () => Promise.resolve(mock.client),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("@/app/api/home/route");

function request() {
  return new Request("http://localhost/api/home?locale=fr") as never;
}

beforeEach(() => mock.reset());

describe("GET /api/home", () => {
  it("includes the real platform counts in the payload", async () => {
    mock.enqueue("games", { data: [] }, { data: [] }, { count: 5000 });
    mock.enqueue("characters", { data: [] }, { count: 2000 });
    mock.enqueue("game_reviews", { data: [] }, { count: 1200 });
    mock.enqueue("profiles", { count: 500 });

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      trending: [],
      upcoming: [],
      popularCharacters: [],
      recentReviews: [],
      showcaseGames: [],
      showcaseCharacters: [],
      stats: { games: 5000, characters: 2000, players: 500, reviews: 1200 },
    });
  });

  it("returns null stats when a count is unavailable", async () => {
    mock.enqueue("games", { data: [] }, { data: [] }, { error: { message: "fail" } });
    mock.enqueue("characters", { data: [] }, { count: 2 });
    mock.enqueue("game_reviews", { data: [] }, { count: 1 });
    mock.enqueue("profiles", { count: 1 });

    const body = await (await GET(request())).json();

    expect(body.stats).toBeNull();
  });
});
