import { describe, test, expect, beforeEach, vi } from "vitest";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

let mockSupabaseFrom: any;

const USER = testUser("user", { id: "user-1", email: "test@test.com" });
const routeEnv = useTestRouteEnvironment({ signedInAs: USER });

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (mockSupabaseFrom) return mockSupabaseFrom(table);
        return {};
      },
    }),
}));

vi.mock("@/lib/utils/untypedTable", () => ({
  untypedTable: (supabase: any, name: string) => supabase.from(name),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { mockReviewVoted } = vi.hoisted(() => ({
  mockReviewVoted: vi.fn(),
}));

vi.mock("@/lib/services/notifications", () => ({
  reviewVoted: mockReviewVoted,
}));

const { POST, DELETE } = await import("@/app/api/review-votes/route");

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}

function jsonBody(data: object): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

describe("POST /api/review-votes", () => {
  beforeEach(() => {
    mockSupabaseFrom = null;
    mockReviewVoted.mockReset();
    mockReviewVoted.mockResolvedValue(null);
  });

  test("returns 401 when not authenticated", async () => {
    routeEnv.signOut();
    const res = await POST(
      makeRequest(
        "http://localhost/api/review-votes",
        jsonBody({ reviewId: "r1", voteType: "helpful" })
      )
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  test("returns 400 for invalid vote type", async () => {
    const res = await POST(
      makeRequest(
        "http://localhost/api/review-votes",
        jsonBody({ reviewId: "r1", voteType: "invalid" })
      )
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid vote type", code: "validation" });
  });

  test("returns 429 when the vote limit is exceeded", async () => {
    routeEnv.exceedRateLimit(60);
    const res = await POST(
      makeRequest(
        "http://localhost/api/review-votes",
        jsonBody({ reviewId: "r1", voteType: "helpful" })
      )
    );
    expect(res.status).toBe(429);
    expect(routeEnv.rateLimitHits[0]).toBe(`vote:user:${USER.id}`);
  });

  test("returns 404 when review not found", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "game_reviews") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: { message: "not found" } })),
            })),
          })),
        };
      }
      return {};
    });

    const res = await POST(
      makeRequest(
        "http://localhost/api/review-votes",
        jsonBody({ reviewId: "r1", voteType: "helpful" })
      )
    );
    expect(res.status).toBe(404);
  });

  test("returns 403 when voting on own review", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "game_reviews") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { id: "r1", user_id: USER.id }, error: null })
              ),
            })),
          })),
        };
      }
      return {};
    });

    const res = await POST(
      makeRequest(
        "http://localhost/api/review-votes",
        jsonBody({ reviewId: "r1", voteType: "helpful" })
      )
    );
    expect(res.status).toBe(403);
  });

  test("creates vote when none exists", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "game_reviews") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { id: "r1", user_id: "other-user" }, error: null })
              ),
            })),
          })),
        };
      }
      if (table === "review_votes") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          })),
          insert: vi.fn(() => Promise.resolve({ error: null })),
        };
      }
      return {};
    });

    const res = await POST(
      makeRequest(
        "http://localhost/api/review-votes",
        jsonBody({ reviewId: "r1", voteType: "helpful" })
      )
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.vote).toEqual({ voteType: "helpful" });
  });

  test("sends review_vote notification when creating a new vote", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "game_reviews") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { id: "r1", user_id: "other-user" }, error: null })
              ),
            })),
          })),
        };
      }
      if (table === "review_votes") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          })),
          insert: vi.fn(() => Promise.resolve({ error: null })),
        };
      }
      return {};
    });

    await POST(
      makeRequest(
        "http://localhost/api/review-votes",
        jsonBody({ reviewId: "r1", voteType: "helpful" })
      )
    );
    expect(mockReviewVoted).toHaveBeenCalledWith({
      reviewId: "r1",
      voterId: USER.id,
      authorId: "other-user",
      voteType: "helpful",
    });
  });

  test("does not send notification when toggling vote off", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "game_reviews") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { id: "r1", user_id: "other-user" }, error: null })
              ),
            })),
          })),
        };
      }
      if (table === "review_votes") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "vote-1", vote_type: "helpful" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        };
      }
      return {};
    });

    await POST(
      makeRequest(
        "http://localhost/api/review-votes",
        jsonBody({ reviewId: "r1", voteType: "helpful" })
      )
    );
    expect(mockReviewVoted).not.toHaveBeenCalled();
  });

  test("toggles off when same vote type exists", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "game_reviews") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { id: "r1", user_id: "other-user" }, error: null })
              ),
            })),
          })),
        };
      }
      if (table === "review_votes") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "vote-1", vote_type: "helpful" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        };
      }
      return {};
    });

    const res = await POST(
      makeRequest(
        "http://localhost/api/review-votes",
        jsonBody({ reviewId: "r1", voteType: "helpful" })
      )
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.vote).toBeNull();
  });
});

describe("DELETE /api/review-votes", () => {
  beforeEach(() => {
    mockSupabaseFrom = null;
    mockReviewVoted.mockReset();
    mockReviewVoted.mockResolvedValue(null);
  });

  test("returns 401 when not authenticated", async () => {
    routeEnv.signOut();
    const res = await DELETE(
      makeRequest("http://localhost/api/review-votes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      })
    );
    expect(res.status).toBe(401);
  });

  test("deletes vote successfully", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "review_votes") {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        };
      }
      return {};
    });

    const res = await DELETE(
      makeRequest("http://localhost/api/review-votes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
