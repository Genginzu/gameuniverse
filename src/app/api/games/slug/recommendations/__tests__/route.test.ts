import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

import { useTestRouteEnvironment } from "@/test-helpers/route-environment";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import type { GameRecommendation } from "@/types/recommendation";

const routeEnv = useTestRouteEnvironment();
const db = createSupabaseQueryMock();

const { mockGetRecommendationsForGame } = vi.hoisted(() => ({
  mockGetRecommendationsForGame: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve(db.client)),
}));
vi.mock("@/lib/services/recommendationService", () => ({
  getRecommendationsForGame: mockGetRecommendationsForGame,
  MAX_RECOMMENDATION_LIMIT: 50,
}));

import { GET } from "@/app/api/games/[slug]/recommendations/route";

const GAME_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const SAMPLE: GameRecommendation[] = [
  {
    id: "rec-1",
    slug: "elden-ring",
    title: "Elden Ring",
    coverImage: "/images/elden.jpg",
    genres: [{ id: "g1", name: "RPG" }],
    developer: "FromSoftware",
    metascore: 96,
    combinedScore: 0.85,
    reason: null,
  },
];

function call(slug = "zelda-totk", query = "") {
  return GET(new NextRequest(`http://localhost/api/games/${slug}/recommendations${query}`), {
    params: Promise.resolve({ slug }),
  });
}

beforeEach(() => {
  db.reset();
  mockGetRecommendationsForGame.mockReset().mockResolvedValue(SAMPLE);
});

describe("GET /api/games/[slug]/recommendations", () => {
  it("returns 404 when the slug does not exist", async () => {
    db.enqueue("games", { data: null, error: { code: "PGRST116" } });

    const res = await call("nonexistent");

    expect(res.status).toBe(404);
    expect(mockGetRecommendationsForGame).not.toHaveBeenCalled();
  });

  it("returns the recommendations for anonymous visitors", async () => {
    db.enqueue("games", { data: { id: GAME_ID } });

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.recommendations).toEqual(SAMPLE);
    expect(body.sourceGameId).toBe(GAME_ID);
    expect(new Date(body.generatedAt).toISOString()).toBe(body.generatedAt);
    expect(db.callsFor("games", "eq")).toEqual([["slug", "zelda-totk"]]);
  });

  it("passes limit and locale, ignoring invalid values", async () => {
    db.enqueue("games", { data: { id: GAME_ID } }, { data: { id: GAME_ID } });

    await call("zelda-totk", "?limit=5&locale=fr");
    await call("zelda-totk", "?limit=-3");

    expect(mockGetRecommendationsForGame).toHaveBeenNthCalledWith(1, expect.anything(), GAME_ID, {
      limit: 5,
      locale: "fr",
    });
    expect(mockGetRecommendationsForGame).toHaveBeenNthCalledWith(2, expect.anything(), GAME_ID, {
      limit: undefined,
      locale: undefined,
    });
  });

  it("is not rate limited (cheap single-source scoring)", async () => {
    routeEnv.signIn();
    db.enqueue("games", { data: { id: GAME_ID } });

    await call();

    expect(routeEnv.rateLimitHits).toEqual([]);
  });

  it("answers 500 when scoring fails", async () => {
    db.enqueue("games", { data: { id: GAME_ID } });
    mockGetRecommendationsForGame.mockRejectedValue(new Error("DB down"));

    const res = await call();

    expect(res.status).toBe(500);
  });
});
