/**
 * Tests for admin comments API routes (GET list + GET/PUT/DELETE by id)
 * Placed in isolated/ because vi.mock() conflicts with parallel tests.
 *
 * Requirements: 4.1, 5.2, 6.2, 7.1, 7.2
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

// --- Mock state ---
let mockRequireAdmin: ReturnType<typeof mock>;
let mockSupabaseFrom: ReturnType<typeof mock>;

const sampleCommentRow = {
  id: "comment-1",
  user_id: "user-1",
  character_id: "char-1",
  content: "Great character with amazing abilities",
  created_at: "2024-02-15T10:00:00Z",
  updated_at: "2024-02-15T10:00:00Z",
  characters: { id: "char-1", character_translations: [{ name: "Link" }] },
};

const sampleProfiles = [{ id: "user-1", username: "player1", email: "player1@test.com" }];

vi.mock("../../../../src/lib/auth-admin", () => ({
  requireAdmin: () => {
    if (mockRequireAdmin) return mockRequireAdmin();
    return Promise.resolve(true);
  },
}));

vi.mock("../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (mockSupabaseFrom) return mockSupabaseFrom(table);
        return {};
      },
    }),
}));

// Import after mocks
const { GET: GET_LIST } = await import("../../../../src/app/api/admin/comments/route");
const {
  GET: GET_DETAIL,
  PUT,
  DELETE: DELETE_HANDLER,
} = await import("../../../../src/app/api/admin/comments/[id]/route");

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("Admin Comments API", () => {
  beforeEach(() => {
    mockRequireAdmin = vi.fn(() => Promise.resolve(true));
    mockSupabaseFrom = null as unknown as ReturnType<typeof mock>;
  });

  // =====================
  // GET /api/admin/comments (list)
  // =====================
  describe("GET /api/admin/comments", () => {
    test("returns 403 when user is not admin (Req 7.1, 7.2)", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });
      const res = await GET_LIST(makeRequest("http://localhost/api/admin/comments"));
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe("Admin access required");
    });

    test("returns paginated comments with correct structure (Req 4.1)", async () => {
      const rows = [sampleCommentRow];
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: sampleProfiles, error: null })),
            })),
          };
        }
        // character_comments
        return {
          select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) return Promise.resolve({ count: 1, error: null });
            return {
              order: vi.fn(() => ({
                range: vi.fn(() => Promise.resolve({ data: rows, error: null })),
              })),
            };
          }),
        };
      });

      const res = await GET_LIST(makeRequest("http://localhost/api/admin/comments"));
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.comments).toHaveLength(1);
      expect(body.pagination.totalCount).toBe(1);
      expect(body.pagination.currentPage).toBe(1);
      expect(body.pagination.limit).toBe(20);

      const comment = body.comments[0];
      expect(comment.playerName).toBe("player1");
      expect(comment.characterName).toBe("Link");
      expect(comment.contentExcerpt).toBeDefined();
      expect(comment.createdAt).toBeDefined();
    });
  });

  // =====================
  // GET /api/admin/comments/[id]
  // =====================
  describe("GET /api/admin/comments/[id]", () => {
    test("returns 403 when user is not admin (Req 7.1, 7.2)", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });
      const res = await GET_DETAIL(
        makeRequest("http://localhost/api/admin/comments/comment-1"),
        makeParams("comment-1")
      );
      expect(res.status).toBe(403);
    });

    test("returns 404 when comment not found", async () => {
      mockSupabaseFrom = vi.fn(() => ({
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
      }));

      const res = await GET_DETAIL(
        makeRequest("http://localhost/api/admin/comments/nonexistent"),
        makeParams("nonexistent")
      );
      expect(res.status).toBe(404);
    });

    test("returns comment detail when found", async () => {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { username: "player1" },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        // character_comments
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: sampleCommentRow, error: null })),
            })),
          })),
        };
      });

      const res = await GET_DETAIL(
        makeRequest("http://localhost/api/admin/comments/comment-1"),
        makeParams("comment-1")
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe("comment-1");
      expect(body.content).toBe("Great character with amazing abilities");
      expect(body.playerName).toBe("player1");
      expect(body.characterName).toBe("Link");
    });
  });

  // =====================
  // PUT /api/admin/comments/[id]
  // =====================
  describe("PUT /api/admin/comments/[id]", () => {
    const validBody = { content: "Updated comment content" };

    test("returns 403 when user is not admin (Req 7.1, 7.2)", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });
      const res = await PUT(
        makeRequest("http://localhost/api/admin/comments/comment-1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validBody),
        }),
        makeParams("comment-1")
      );
      expect(res.status).toBe(403);
    });

    test("returns 400 for invalid input — empty content (Req 5.2)", async () => {
      const res = await PUT(
        makeRequest("http://localhost/api/admin/comments/comment-1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "   " }),
        }),
        makeParams("comment-1")
      );
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Invalid input data");
    });

    test("returns 404 when comment does not exist", async () => {
      mockSupabaseFrom = vi.fn(() => ({
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
      }));

      const res = await PUT(
        makeRequest("http://localhost/api/admin/comments/nonexistent", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validBody),
        }),
        makeParams("nonexistent")
      );
      expect(res.status).toBe(404);
    });

    test("updates comment successfully (Req 5.2)", async () => {
      const updatedRow = {
        ...sampleCommentRow,
        content: "Updated comment content",
        updated_at: "2024-02-15T14:00:00Z",
      };
      let callCount = 0;

      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { username: "player1" },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        // character_comments
        callCount++;
        if (callCount === 1) {
          // Existence check
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "comment-1" },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        if (callCount === 2) {
          // Update
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          };
        }
        // Fetch updated
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: updatedRow, error: null })),
            })),
          })),
        };
      });

      const res = await PUT(
        makeRequest("http://localhost/api/admin/comments/comment-1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validBody),
        }),
        makeParams("comment-1")
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.content).toBe("Updated comment content");
      expect(body.playerName).toBe("player1");
    });
  });

  // =====================
  // DELETE /api/admin/comments/[id]
  // =====================
  describe("DELETE /api/admin/comments/[id]", () => {
    test("returns 403 when user is not admin (Req 7.1, 7.2)", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });
      const res = await DELETE_HANDLER(
        makeRequest("http://localhost/api/admin/comments/comment-1"),
        makeParams("comment-1")
      );
      expect(res.status).toBe(403);
    });

    test("returns 404 when comment does not exist", async () => {
      mockSupabaseFrom = vi.fn(() => ({
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
      }));

      const res = await DELETE_HANDLER(
        makeRequest("http://localhost/api/admin/comments/nonexistent"),
        makeParams("nonexistent")
      );
      expect(res.status).toBe(404);
    });

    test("deletes comment successfully (Req 6.2)", async () => {
      let callCount = 0;
      mockSupabaseFrom = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // Existence check
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "comment-1" },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        // Delete
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        };
      });

      const res = await DELETE_HANDLER(
        makeRequest("http://localhost/api/admin/comments/comment-1"),
        makeParams("comment-1")
      );
      expect(res.status).toBe(200);
      expect((await res.json()).success).toBe(true);
    });
  });
});
