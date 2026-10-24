import { describe, test, expect, beforeEach, vi } from "vitest";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

// --- Mock state ---
let mockSupabaseFrom: ReturnType<typeof vi.fn> | null;

const routeEnv = useTestRouteEnvironment();

function supaChain(result: any) {
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

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (mockSupabaseFrom) return mockSupabaseFrom(table);
        return {};
      },
    }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/services/activityRewards", () => ({
  rewardActivity: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/utils/reviewVoteQueries", () => ({
  fetchVoteCountsMap: vi.fn(() => Promise.resolve(new Map())),
  fetchUserVotesMap: vi.fn(() => Promise.resolve(new Map())),
  enrichReviewsWithVotes: vi.fn((reviews: any[]) =>
    reviews.map((r) => ({ ...r, voteCounts: { helpful: 0, unhelpful: 0 }, userVote: null }))
  ),
}));

const { GET, POST, PUT, computeAverageRating, sortReviewsByHelpfulVotes } =
  await import("@/app/api/reviews/route");

function makeRequest(url: string, init?: RequestInit) {
  const req = new Request(url, init) as unknown as import("next/server").NextRequest;
  (req as Record<string, unknown>).nextUrl = new URL(url);
  return req;
}

describe("computeAverageRating", () => {
  test("returns null for empty array", () => {
    expect(computeAverageRating([])).toBeNull();
  });

  test("returns average for [10, 20]", () => {
    expect(computeAverageRating([{ rating: 10 }, { rating: 20 }])).toBe(15);
  });
});

describe("sortReviewsByHelpfulVotes", () => {
  test("places current user first, then by helpful desc, then by date", () => {
    const reviews = [
      { userId: "other-1", voteCounts: { helpful: 5 }, createdAt: "2024-01-01T00:00:00Z" },
      { userId: "me", voteCounts: { helpful: 10 }, createdAt: "2024-01-02T00:00:00Z" },
      { userId: "other-2", voteCounts: { helpful: 5 }, createdAt: "2024-01-03T00:00:00Z" },
    ];
    const sorted = sortReviewsByHelpfulVotes(reviews, "me");
    expect(sorted[0].userId).toBe("me");
    expect(sorted[1].userId).toBe("other-2"); // same helpful, newer date
    expect(sorted[2].userId).toBe("other-1");
  });
});

describe("GET /api/reviews", () => {
  beforeEach(() => {
    mockSupabaseFrom = null;
  });

  test("returns 400 without gameId", async () => {
    const res = await GET(makeRequest("http://localhost/api/reviews"));
    expect(res.status).toBe(400);
  });

  test("returns 404 when game not found", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "games") {
        return supaChain({ data: null, error: { code: "PGRST116" } });
      }
      return {};
    });
    const res = await GET(makeRequest("http://localhost/api/reviews?gameId=unknown"));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/reviews", () => {
  beforeEach(() => {
    mockSupabaseFrom = null;
  });

  test("returns 401 when not authenticated", async () => {
    routeEnv.signOut();
    const res = await POST(
      makeRequest("http://localhost/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          gameId: "g1",
          rating: 10,
          content: "ok",
          positivePoints: [],
          negativePoints: [],
        }),
      })
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  test("returns 400 for invalid body", async () => {
    routeEnv.signIn(testUser("user", { id: "user-1" }));
    const res = await POST(
      makeRequest("http://localhost/api/reviews", {
        method: "POST",
        body: JSON.stringify({ gameId: "g1" }),
      })
    );
    expect(res.status).toBe(400);
  });

  test("returns 201 on success", async () => {
    const user = routeEnv.signIn(testUser("user", { id: "user-1" }));

    const insertedReview = { id: "r1", user_id: user.id, game_id: "g1", rating: 15 };

    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "games") return supaChain({ data: { id: "g1" }, error: null });
      if (table === "game_reviews") {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: insertedReview, error: null }),
            }),
          }),
        };
      }
      if (table === "user_library") return { insert: () => Promise.resolve({ error: null }) };
      return {};
    });

    const res = await POST(
      makeRequest("http://localhost/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          gameId: "g1",
          rating: 15,
          content: "Great game",
          positivePoints: [],
          negativePoints: [],
        }),
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

describe("POST/PUT /api/reviews refusals", () => {
  const reviewBody = JSON.stringify({
    gameId: "g1",
    rating: 15,
    content: "Great game",
    positivePoints: [],
    negativePoints: [],
  });

  beforeEach(() => {
    mockSupabaseFrom = vi.fn(() => ({}));
    routeEnv.signIn(testUser("user", { id: "user-1" }));
  });

  test.each([
    ["POST", POST],
    ["PUT", PUT],
  ])("%s returns 403 suspended for a suspended account", async (method, handler) => {
    routeEnv.suspend("2030-01-01T00:00:00Z");
    const res = await handler(
      makeRequest("http://localhost/api/reviews", { method, body: reviewBody })
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "suspended" });
    expect(mockSupabaseFrom).not.toHaveBeenCalled();
  });

  test.each([
    ["POST", POST],
    ["PUT", PUT],
  ])("%s returns 429 when the review rate limit is exceeded", async (method, handler) => {
    routeEnv.exceedRateLimit(120);
    const res = await handler(
      makeRequest("http://localhost/api/reviews", { method, body: reviewBody })
    );
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ code: "rate_limited", retryAfter: 120 });
    expect(routeEnv.rateLimitHits).toEqual(["review:user:user-1"]);
  });
});
