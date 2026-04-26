/**
 * Tests for admin reviews API routes (GET list + GET/PUT/DELETE by id)
 * Placed in isolated/ because vi.mock() conflicts with parallel tests.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.2, 3.2
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

// --- Mock setup ---
let mockRequireAdmin: ReturnType<typeof mock>;
let mockSupabaseFrom: ReturnType<typeof mock>;

const sampleReviewRow = {
  id: "review-1",
  user_id: "user-1",
  game_id: "game-1",
  rating: 15,
  content: "<p>Great game with nice graphics</p>",
  positive_points: ["Good story"],
  negative_points: ["Too short"],
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  games: { id: "game-1", game_translations: [{ title: "Zelda" }] },
};

const sampleReviewRow2 = {
  ...sampleReviewRow,
  id: "review-2",
  user_id: "user-2",
  rating: 8,
  content: "<p>Average game</p>",
  games: { id: "game-2", game_translations: [{ title: "Mario" }] },
};

const sampleProfiles = [
  { id: "user-1", username: "player1", email: "player1@test.com" },
  { id: "user-2", username: "player2", email: "player2@test.com" },
];

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
const { GET: GET_LIST } = await import("../../../../src/app/api/admin/reviews/route");
const {
  GET: GET_DETAIL,
  PUT,
  DELETE: DELETE_HANDLER,
} = await import("../../../../src/app/api/admin/reviews/[id]/route");

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("Admin Reviews API", () => {
  beforeEach(() => {
    mockRequireAdmin = vi.fn(() => Promise.resolve(true));
    mockSupabaseFrom = null as unknown as ReturnType<typeof mock>;
  });

  // =====================
  // GET /api/admin/reviews (list)
  // =====================
  describe("GET /api/admin/reviews", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });
      const res = await GET_LIST(makeRequest("http://localhost/api/admin/reviews"));
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe("Admin access required");
    });

    test("returns paginated reviews with correct structure", async () => {
      const rows = [sampleReviewRow, sampleReviewRow2];
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: sampleProfiles, error: null })),
            })),
          };
        }
        // game_reviews
        return {
          select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) return Promise.resolve({ count: 2, error: null });
            return {
              order: vi.fn(() => ({
                range: vi.fn(() => Promise.resolve({ data: rows, error: null })),
              })),
            };
          }),
        };
      });

      const res = await GET_LIST(makeRequest("http://localhost/api/admin/reviews"));
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.reviews).toHaveLength(2);
      expect(body.pagination.totalCount).toBe(2);
      expect(body.pagination.currentPage).toBe(1);
      expect(body.pagination.limit).toBe(20);

      // Verify AdminReview shape (Req 1.2)
      const review = body.reviews[0];
      expect(review.playerName).toBe("player1");
      expect(review.gameTitle).toBe("Zelda");
      expect(review.rating).toBe(15);
      expect(review.contentExcerpt).toBeDefined();
      expect(review.createdAt).toBeDefined();
    });

    test("returns empty list when no reviews exist", async () => {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        return {
          select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) return Promise.resolve({ count: 0, error: null });
            return {
              order: vi.fn(() => ({
                range: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            };
          }),
        };
      });

      const res = await GET_LIST(makeRequest("http://localhost/api/admin/reviews"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.reviews).toHaveLength(0);
      expect(body.pagination.totalCount).toBe(0);
    });

    test("returns 500 when count query fails", async () => {
      mockSupabaseFrom = vi.fn(() => ({
        select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.head) return Promise.resolve({ count: null, error: { message: "DB error" } });
          return {
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }),
      }));

      const res = await GET_LIST(makeRequest("http://localhost/api/admin/reviews"));
      expect(res.status).toBe(500);
    });

    test("returns 500 when data query fails", async () => {
      mockSupabaseFrom = vi.fn(() => ({
        select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.head) return Promise.resolve({ count: 1, error: null });
          return {
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: null, error: { message: "DB error" } })),
            })),
          };
        }),
      }));

      const res = await GET_LIST(makeRequest("http://localhost/api/admin/reviews"));
      expect(res.status).toBe(500);
    });
  });

  // =====================
  // GET /api/admin/reviews/[id]
  // =====================
  describe("GET /api/admin/reviews/[id]", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });
      const res = await GET_DETAIL(
        makeRequest("http://localhost/api/admin/reviews/review-1"),
        makeParams("review-1")
      );
      expect(res.status).toBe(403);
    });

    test("returns review detail when found", async () => {
      let callCount = 0;
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { username: "player1" }, error: null })
                ),
              })),
            })),
          };
        }
        // game_reviews
        callCount++;
        const singleMock = vi.fn(() => Promise.resolve({ data: sampleReviewRow, error: null }));
        const eqMock = vi.fn(() => ({ single: singleMock }));
        const selectMock = vi.fn(() => ({ eq: eqMock }));
        return { select: selectMock };
      });

      const res = await GET_DETAIL(
        makeRequest("http://localhost/api/admin/reviews/review-1"),
        makeParams("review-1")
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe("review-1");
      expect(body.rating).toBe(15);
      expect(body.content).toBe("<p>Great game with nice graphics</p>");
      expect(body.positivePoints).toEqual(["Good story"]);
      expect(body.negativePoints).toEqual(["Too short"]);
      expect(body.playerName).toBe("player1");
      expect(body.gameTitle).toBe("Zelda");
    });

    test("returns 404 when review not found", async () => {
      const singleMock = vi.fn(() =>
        Promise.resolve({ data: null, error: { code: "PGRST116", message: "not found" } })
      );
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));
      mockSupabaseFrom = vi.fn(() => ({ select: selectMock }));

      const res = await GET_DETAIL(
        makeRequest("http://localhost/api/admin/reviews/nonexistent"),
        makeParams("nonexistent")
      );
      expect(res.status).toBe(404);
    });
  });

  // =====================
  // PUT /api/admin/reviews/[id]
  // =====================
  describe("PUT /api/admin/reviews/[id]", () => {
    const validBody = {
      rating: 18,
      content: "<p>Updated review content</p>",
      positivePoints: ["Amazing"],
      negativePoints: ["Nothing"],
    };

    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });
      const res = await PUT(
        makeRequest("http://localhost/api/admin/reviews/review-1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validBody),
        }),
        makeParams("review-1")
      );
      expect(res.status).toBe(403);
    });

    test("returns 400 for invalid input", async () => {
      const res = await PUT(
        makeRequest("http://localhost/api/admin/reviews/review-1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: 25, content: "" }),
        }),
        makeParams("review-1")
      );
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Invalid input data");
    });

    test("returns 404 when review does not exist", async () => {
      const singleMock = vi.fn(() =>
        Promise.resolve({ data: null, error: { code: "PGRST116", message: "not found" } })
      );
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));
      mockSupabaseFrom = vi.fn(() => ({ select: selectMock }));

      const res = await PUT(
        makeRequest("http://localhost/api/admin/reviews/nonexistent", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validBody),
        }),
        makeParams("nonexistent")
      );
      expect(res.status).toBe(404);
    });

    test("updates review successfully (Req 2.2)", async () => {
      const updatedRow = {
        ...sampleReviewRow,
        rating: 18,
        content: "<p>Updated review content</p>",
      };
      let callCount = 0;

      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { username: "player1" }, error: null })
                ),
              })),
            })),
          };
        }
        // game_reviews
        callCount++;
        if (callCount === 1) {
          // Existence check
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { id: "review-1" }, error: null })),
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
        makeRequest("http://localhost/api/admin/reviews/review-1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validBody),
        }),
        makeParams("review-1")
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rating).toBe(18);
    });
  });

  // =====================
  // DELETE /api/admin/reviews/[id]
  // =====================
  describe("DELETE /api/admin/reviews/[id]", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });
      const res = await DELETE_HANDLER(
        makeRequest("http://localhost/api/admin/reviews/review-1"),
        makeParams("review-1")
      );
      expect(res.status).toBe(403);
    });

    test("returns 404 when review does not exist", async () => {
      const singleMock = vi.fn(() =>
        Promise.resolve({ data: null, error: { code: "PGRST116", message: "not found" } })
      );
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));
      mockSupabaseFrom = vi.fn(() => ({ select: selectMock }));

      const res = await DELETE_HANDLER(
        makeRequest("http://localhost/api/admin/reviews/nonexistent"),
        makeParams("nonexistent")
      );
      expect(res.status).toBe(404);
    });

    test("deletes review successfully (Req 3.2)", async () => {
      let callCount = 0;
      mockSupabaseFrom = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { id: "review-1" }, error: null })),
              })),
            })),
          };
        }
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        };
      });

      const res = await DELETE_HANDLER(
        makeRequest("http://localhost/api/admin/reviews/review-1"),
        makeParams("review-1")
      );
      expect(res.status).toBe(200);
      expect((await res.json()).success).toBe(true);
    });

    test("returns 500 when delete fails", async () => {
      let callCount = 0;
      mockSupabaseFrom = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { id: "review-1" }, error: null })),
              })),
            })),
          };
        }
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: { message: "DB error" } })),
          })),
        };
      });

      const res = await DELETE_HANDLER(
        makeRequest("http://localhost/api/admin/reviews/review-1"),
        makeParams("review-1")
      );
      expect(res.status).toBe(500);
    });
  });
});
