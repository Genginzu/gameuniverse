/**
 * Tests for player comments API routes (GET, POST, PUT)
 *
 * Requirements: 1.2, 1.3, 2.1, 7.4
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

// --- Mock state ---
let mockSupabaseFrom: ReturnType<typeof vi.fn>;

const AUTHENTICATED_USER = testUser("user", { id: "user-1", email: "player@test.com" });

const routeEnv = useTestRouteEnvironment({ signedInAs: AUTHENTICATED_USER });

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (mockSupabaseFrom) return mockSupabaseFrom(table);
        return {};
      },
    }),
}));

// Import after mocks
const { GET, POST, PUT } = await import("@/app/api/comments/route");

function makeRequest(url: string, init?: RequestInit) {
  const req = new Request(url, init) as unknown as import("next/server").NextRequest;
  const parsedUrl = new URL(url);
  // Next.js NextRequest has nextUrl with searchParams
  (req as Record<string, unknown>).nextUrl = parsedUrl;
  return req;
}
describe("Comments API — GET /api/comments", () => {
  beforeEach(() => {
    mockSupabaseFrom = null as unknown as ReturnType<typeof vi.fn>;
  });

  test("returns 400 if characterId is missing", async () => {
    const res = await GET(makeRequest("http://localhost/api/comments"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("characterId");
  });

  test("returns 404 if character does not exist", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "characters") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { code: "PGRST116", message: "not found" },
                })
              ),
            })),
          })),
        };
      }
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/comments?characterId=nonexistent-id"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });

  test("returns comments list with correct structure", async () => {
    const commentRows = [
      {
        id: "c1",
        user_id: "user-1",
        character_id: "char-1",
        content: "Great character!",
        created_at: "2024-02-01T10:00:00Z",
        updated_at: "2024-02-01T10:00:00Z",
      },
    ];
    const profiles = [{ id: "user-1", username: "player1", avatar_url: null }];

    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "characters") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: "char-1" }, error: null })),
            })),
          })),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: profiles, error: null })),
          })),
        };
      }
      // character_comments
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: commentRows, error: null })),
          })),
        })),
      };
    });

    const res = await GET(makeRequest("http://localhost/api/comments?characterId=char-1"));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.comments).toHaveLength(1);
    expect(body.totalCount).toBe(1);
    expect(body.userHasCommented).toBe(true);
    expect(body.userComment).toBeDefined();
    expect(body.comments[0].playerName).toBe("player1");
    expect(body.comments[0].content).toBe("Great character!");
  });
});
describe("Comments API — POST /api/comments", () => {
  beforeEach(() => {
    mockSupabaseFrom = null as unknown as ReturnType<typeof vi.fn>;
  });

  test("returns 401 if user is not authenticated (Req 7.4)", async () => {
    routeEnv.signOut();

    const res = await POST(
      makeRequest("http://localhost/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: "char-1", content: "Hello" }),
      })
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  test("returns 400 if content validation fails (Req 2.1)", async () => {

    const res = await POST(
      makeRequest("http://localhost/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: "char-1", content: "   " }),
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test("returns 400 if characterId is missing", async () => {

    const res = await POST(
      makeRequest("http://localhost/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Valid comment" }),
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("characterId");
  });

  test("returns 409 if user already commented on this character (Req 1.3)", async () => {

    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "characters") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: "char-1" }, error: null })),
            })),
          })),
        };
      }
      // character_comments — insert triggers unique constraint violation
      return {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { code: "23505", message: "duplicate key" },
              })
            ),
          })),
        })),
      };
    });

    const res = await POST(
      makeRequest("http://localhost/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: "char-1", content: "Duplicate" }),
      })
    );
    expect(res.status).toBe(409);
  });

  test("creates comment successfully (Req 1.2)", async () => {

    const insertedComment = {
      id: "new-comment",
      user_id: "user-1",
      character_id: "char-1",
      content: "Nice character!",
      created_at: "2024-02-01T12:00:00Z",
      updated_at: "2024-02-01T12:00:00Z",
    };

    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "characters") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: "char-1" }, error: null })),
            })),
          })),
        };
      }
      // character_comments — successful insert
      return {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: insertedComment, error: null })),
          })),
        })),
      };
    });

    const res = await POST(
      makeRequest("http://localhost/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: "char-1", content: "Nice character!" }),
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.comment.content).toBe("Nice character!");
  });
});
describe("Comments API — PUT /api/comments", () => {
  beforeEach(() => {
    mockSupabaseFrom = null as unknown as ReturnType<typeof vi.fn>;
  });

  test("returns 401 if user is not authenticated (Req 7.4)", async () => {
    routeEnv.signOut();

    const res = await PUT(
      makeRequest("http://localhost/api/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: "char-1", content: "Updated" }),
      })
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  test("returns 400 if content validation fails", async () => {

    const res = await PUT(
      makeRequest("http://localhost/api/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: "char-1", content: "" }),
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test("returns 400 if characterId is missing", async () => {

    const res = await PUT(
      makeRequest("http://localhost/api/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Updated content" }),
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("characterId");
  });

  test("updates comment successfully", async () => {

    const updatedComment = {
      id: "c1",
      user_id: "user-1",
      character_id: "char-1",
      content: "Updated content",
      created_at: "2024-02-01T10:00:00Z",
      updated_at: "2024-02-01T14:00:00Z",
    };

    mockSupabaseFrom = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: updatedComment, error: null })),
            })),
          })),
        })),
      })),
    }));

    const res = await PUT(
      makeRequest("http://localhost/api/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: "char-1", content: "Updated content" }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.comment.content).toBe("Updated content");
  });
});
describe("Comments API — POST/PUT refusals", () => {
  beforeEach(() => {
    mockSupabaseFrom = vi.fn(() => ({}));
  });

  function writeRequest(method: string) {
    return makeRequest("http://localhost/api/comments", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: "char-1", content: "Hello" }),
    });
  }

  test.each([
    ["POST", POST],
    ["PUT", PUT],
  ])("%s returns 403 suspended for a suspended account", async (method, handler) => {
    routeEnv.suspend("2030-01-01T00:00:00Z");
    const res = await handler(writeRequest(method));
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "suspended" });
    expect(mockSupabaseFrom).not.toHaveBeenCalled();
  });

  test.each([
    ["POST", POST],
    ["PUT", PUT],
  ])("%s returns 429 when the comment rate limit is exceeded", async (method, handler) => {
    routeEnv.exceedRateLimit(60);
    const res = await handler(writeRequest(method));
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ code: "rate_limited", retryAfter: 60 });
    expect(routeEnv.rateLimitHits).toEqual(["comment:user:user-1"]);
  });
});
