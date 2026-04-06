import { describe, test, expect, beforeEach, vi } from "vitest";

let mockSupabaseFrom: any;
let mockGetUser: any;

vi.mock("../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (mockSupabaseFrom) return mockSupabaseFrom(table);
        return {};
      },
      auth: {
        getUser: () =>
          mockGetUser?.() ??
          Promise.resolve({ data: { user: null }, error: null }),
      },
    }),
}));

vi.mock("../../../src/lib/utils/untypedTable", () => ({
  untypedTable: (supabase: any, name: string) => supabase.from(name),
}));

vi.mock("../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { POST, DELETE } = await import(
  "../../../src/app/api/review-votes/route"
);

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

const USER = { id: "user-1", email: "test@test.com" };

describe("POST /api/review-votes", () => {
  beforeEach(() => {
    mockSupabaseFrom = null;
    mockGetUser = null;
  });

  test("returns 401 when not authenticated", async () => {
    mockGetUser = vi.fn(() =>
      Promise.resolve({ data: { user: null }, error: { message: "No session" } })
    );

    const res = await POST(
      makeRequest("http://localhost/api/review-votes", jsonBody({ reviewId: "r1", voteType: "helpful" }))
    );
    expect(res.status).toBe(401);
  });

  test("returns 400 for invalid vote type", async () => {
    mockGetUser = vi.fn(() =>
      Promise.resolve({ data: { user: USER }, error: null })
    );

    const res = await POST(
      makeRequest("http://localhost/api/review-votes", jsonBody({ reviewId: "r1", voteType: "invalid" }))
    );
    expect(res.status).toBe(400);
  });

  test("returns 404 when review not found", async () => {
    mockGetUser = vi.fn(() =>
      Promise.resolve({ data: { user: USER }, error: null })
    );
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "game_reviews") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: null, error: { message: "not found" } })
              ),
            })),
          })),
        };
      }
      return {};
    });

    const res = await POST(
      makeRequest("http://localhost/api/review-votes", jsonBody({ reviewId: "r1", voteType: "helpful" }))
    );
    expect(res.status).toBe(404);
  });

  test("returns 403 when voting on own review", async () => {
    mockGetUser = vi.fn(() =>
      Promise.resolve({ data: { user: USER }, error: null })
    );
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
      makeRequest("http://localhost/api/review-votes", jsonBody({ reviewId: "r1", voteType: "helpful" }))
    );
    expect(res.status).toBe(403);
  });

  test("creates vote when none exists", async () => {
    mockGetUser = vi.fn(() =>
      Promise.resolve({ data: { user: USER }, error: null })
    );
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
                  Promise.resolve({ data: null, error: null })
                ),
              })),
            })),
          })),
          insert: vi.fn(() => Promise.resolve({ error: null })),
        };
      }
      return {};
    });

    const res = await POST(
      makeRequest("http://localhost/api/review-votes", jsonBody({ reviewId: "r1", voteType: "helpful" }))
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.vote).toEqual({ voteType: "helpful" });
  });

  test("toggles off when same vote type exists", async () => {
    mockGetUser = vi.fn(() =>
      Promise.resolve({ data: { user: USER }, error: null })
    );
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
      makeRequest("http://localhost/api/review-votes", jsonBody({ reviewId: "r1", voteType: "helpful" }))
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.vote).toBeNull();
  });
});

describe("DELETE /api/review-votes", () => {
  beforeEach(() => {
    mockSupabaseFrom = null;
    mockGetUser = null;
  });

  test("returns 401 when not authenticated", async () => {
    mockGetUser = vi.fn(() =>
      Promise.resolve({ data: { user: null }, error: { message: "No session" } })
    );

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
    mockGetUser = vi.fn(() =>
      Promise.resolve({ data: { user: USER }, error: null })
    );
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
