/**
 * Tests for the coaching reviews API route (GET list + POST create).
 *
 * Issue #377 — hardened coaching_reviews RLS. These tests exercise the real
 * route handlers to prove the legit student-review flow still works and the
 * API-layer guards (completed session, ownership, no duplicate) are intact.
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

let mockSupabaseFrom: ReturnType<typeof vi.fn>;

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => mockSupabaseFrom(table),
    }),
}));

const { GET, POST } = await import("@/app/api/coaching/reviews/route");

function makeRequest(url: string, init?: RequestInit) {
  const req = new Request(url, init);
  // The real GET handler reads request.nextUrl.searchParams; a plain Request
  // has no nextUrl, so expose one backed by the request URL.
  Object.defineProperty(req, "nextUrl", { value: new URL(url), configurable: true });
  return req as unknown as import("next/server").NextRequest;
}

const routeEnv = useTestRouteEnvironment({ signedInAs: testUser("user", { id: "student-1" }) });

const completedSession = {
  id: "session-1",
  coach_id: "coach-1",
  student_id: "student-1",
  status: "completed",
};

describe("Coaching reviews API — GET", () => {
  beforeEach(() => {
    mockSupabaseFrom = vi.fn();
  });

  test("returns 400 when coachId is missing", async () => {
    const res = await GET(makeRequest("http://localhost/api/coaching/reviews"));
    expect(res.status).toBe(400);
  });

  test("returns mapped reviews for a coach", async () => {
    mockSupabaseFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data: [
                {
                  id: "review-1",
                  rating: 5,
                  comment: "Great",
                  coach_response: null,
                  coach_responded_at: null,
                  created_at: "2026-01-01T00:00:00Z",
                  student_id: "student-1",
                  profiles: { username: "alice", avatar_url: "a.png" },
                },
              ],
              error: null,
            })
          ),
        })),
      })),
    }));

    const res = await GET(makeRequest("http://localhost/api/coaching/reviews?coachId=coach-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reviews).toHaveLength(1);
    expect(body.reviews[0].rating).toBe(5);
    expect(body.reviews[0].student.username).toBe("alice");
  });

  test("keeps a review whose student deleted their account, with a null student", async () => {
    mockSupabaseFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data: [
                {
                  id: "review-2",
                  rating: 4,
                  comment: "Useful",
                  coach_response: "Thanks!",
                  coach_responded_at: "2026-01-02T00:00:00Z",
                  created_at: "2026-01-01T00:00:00Z",
                  student_id: null,
                  profiles: null,
                },
              ],
              error: null,
            })
          ),
        })),
      })),
    }));

    const res = await GET(makeRequest("http://localhost/api/coaching/reviews?coachId=coach-1"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.reviews[0].student).toEqual({ username: null, avatarUrl: null });
    expect(body.reviews[0].coachResponse).toBe("Thanks!");
  });
});

describe("Coaching reviews API — POST", () => {
  beforeEach(() => {
    mockSupabaseFrom = vi.fn();
  });

  test("returns 401 when unauthenticated", async () => {
    routeEnv.signOut();
    const res = await POST(
      makeRequest("http://localhost/api/coaching/reviews", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-1", rating: 5 }),
      })
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  test("returns 403 suspended for a suspended account", async () => {
    routeEnv.suspend("2026-12-31T00:00:00Z");
    const res = await POST(
      makeRequest("http://localhost/api/coaching/reviews", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-1", rating: 5 }),
      })
    );
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("suspended");
  });

  test("returns 429 when the review rate limit is exceeded", async () => {
    routeEnv.exceedRateLimit(30);
    const res = await POST(
      makeRequest("http://localhost/api/coaching/reviews", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-1", rating: 5 }),
      })
    );
    expect(res.status).toBe(429);
    expect(routeEnv.rateLimitHits).toEqual(["review:user:student-1"]);
  });

  test("returns 400 when sessionId or rating missing", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/coaching/reviews", {
        method: "POST",
        body: JSON.stringify({ rating: 5 }),
      })
    );
    expect(res.status).toBe(400);
  });

  test("returns 400 for out-of-range rating", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/coaching/reviews", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-1", rating: 9 }),
      })
    );
    expect(res.status).toBe(400);
  });

  test("returns 403 when the caller is not the session student", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "coaching_sessions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { ...completedSession, student_id: "someone-else" },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      return {};
    });

    const res = await POST(
      makeRequest("http://localhost/api/coaching/reviews", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-1", rating: 5 }),
      })
    );
    expect(res.status).toBe(403);
  });

  test("returns 400 when session is not completed", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "coaching_sessions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { ...completedSession, status: "confirmed" },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      return {};
    });

    const res = await POST(
      makeRequest("http://localhost/api/coaching/reviews", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-1", rating: 5 }),
      })
    );
    expect(res.status).toBe(400);
  });

  test("returns 409 when a review already exists for the session", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "coaching_sessions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: completedSession, error: null })),
            })),
          })),
        };
      }
      // coaching_reviews existence check
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: "review-1" }, error: null })),
          })),
        })),
      };
    });

    const res = await POST(
      makeRequest("http://localhost/api/coaching/reviews", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-1", rating: 5 }),
      })
    );
    expect(res.status).toBe(409);
  });

  test("creates a review for a completed, owned session (legit flow)", async () => {
    let insertedPayload: Record<string, unknown> | null = null;
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "coaching_sessions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: completedSession, error: null })),
            })),
          })),
        };
      }
      // coaching_reviews: first existence check (no row), then insert
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
        insert: vi.fn((payload: Record<string, unknown>) => {
          insertedPayload = payload;
          return {
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { id: "review-1", rating: 5, comment: "Great", created_at: "x" },
                  error: null,
                })
              ),
            })),
          };
        }),
      };
    });

    const res = await POST(
      makeRequest("http://localhost/api/coaching/reviews", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-1", rating: 5, comment: "Great" }),
      })
    );
    expect(res.status).toBe(201);
    expect(insertedPayload).toMatchObject({
      session_id: "session-1",
      coach_id: "coach-1",
      student_id: "student-1",
      rating: 5,
      comment: "Great",
    });
  });
});
