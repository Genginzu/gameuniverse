import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";
import type { GameRecommendation } from "@/types/recommendation";

const routeEnv = useTestRouteEnvironment();

const mocks = vi.hoisted(() => ({
  getPersonalRecommendations: vi.fn(),
  countLibraryGames: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve({})),
}));
vi.mock("@/lib/services/recommendationService", () => ({
  getPersonalRecommendations: mocks.getPersonalRecommendations,
  countLibraryGames: mocks.countLibraryGames,
  MAX_RECOMMENDATION_LIMIT: 50,
}));

import { GET } from "@/app/api/recommendations/personal/route";

const USER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

const SAMPLE: GameRecommendation[] = [
  {
    id: "rec-1",
    slug: "elden-ring",
    title: "Elden Ring",
    coverImage: "/elden.jpg",
    genres: [{ id: "g1", name: "RPG" }],
    developer: "FromSoftware",
    metascore: 96,
    combinedScore: 0.85,
  },
];

function request(query = "") {
  return new NextRequest(`http://localhost/api/recommendations/personal${query}`);
}

beforeEach(() => {
  mocks.getPersonalRecommendations.mockReset().mockResolvedValue(SAMPLE);
  mocks.countLibraryGames.mockReset().mockResolvedValue(3);
});

describe("GET /api/recommendations/personal", () => {
  it("returns 401 when signed out", async () => {
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(mocks.getPersonalRecommendations).not.toHaveBeenCalled();
  });

  it("returns the recommendations, the library size and a timestamp", async () => {
    routeEnv.signIn(testUser("user", { id: USER_ID }));

    const res = await GET(request());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.recommendations).toEqual(SAMPLE);
    expect(body.basedOnGameCount).toBe(3);
    expect(new Date(body.generatedAt).toISOString()).toBe(body.generatedAt);
    expect(mocks.countLibraryGames).toHaveBeenCalledWith(expect.anything(), USER_ID);
  });

  it("passes limit and locale, ignoring invalid values", async () => {
    routeEnv.signIn();

    await GET(request("?limit=5&locale=fr"));
    await GET(request("?limit=abc&locale=de"));

    expect(mocks.getPersonalRecommendations).toHaveBeenNthCalledWith(1, expect.anything(), {
      limit: 5,
      locale: "fr",
    });
    expect(mocks.getPersonalRecommendations).toHaveBeenNthCalledWith(2, expect.anything(), {
      limit: undefined,
      locale: undefined,
    });
  });

  it("charges the recommendation rate limit and refuses when exceeded", async () => {
    routeEnv.signIn(testUser("user", { id: USER_ID }));
    await GET(request());
    expect(routeEnv.rateLimitHits).toEqual([`recommendation:user:${USER_ID}`]);

    routeEnv.exceedRateLimit(30);
    const res = await GET(request());
    expect(res.status).toBe(429);
  });

  it("answers 500 when scoring fails", async () => {
    routeEnv.signIn();
    mocks.getPersonalRecommendations.mockRejectedValue(new Error("timeout"));

    const res = await GET(request());
    expect(res.status).toBe(500);
  });
});
