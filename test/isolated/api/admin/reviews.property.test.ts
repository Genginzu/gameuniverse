/**
 * Property-Based Tests for Admin Reviews API - Access Control
 *
 * Feature: admin-review-management, Property 7: Rejet d'accès non-admin
 *
 * _Pour toute_ requête vers les endpoints /api/admin/reviews effectuée par
 * un utilisateur non-administrateur, l'API doit retourner HTTP 403.
 *
 * **Validates: Requirements 4.1, 4.2**
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import * as fc from "fast-check";

// --- Mock setup ---
let mockRequireAdmin: ReturnType<typeof mock>;

mock.module("../../../../src/lib/auth-admin", () => ({
  requireAdmin: () => {
    if (mockRequireAdmin) return mockRequireAdmin();
    return Promise.resolve(true);
  },
}));

mock.module("../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: () => Promise.resolve({ from: () => ({}) }),
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

describe("Admin Reviews API - Property-Based Tests", () => {
  // Feature: admin-review-management, Property 7: Rejet d'accès non-admin

  beforeEach(() => {
    // Non-admin: requireAdmin always throws
    mockRequireAdmin = mock(() => {
      throw new Error("Admin access required");
    });
  });

  describe("Property 7: Rejet d'accès non-admin", () => {
    it("GET /api/admin/reviews returns 403 for any query params when non-admin", () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          fc.option(fc.string({ minLength: 0, maxLength: 30 })),
          async (page, limit, search) => {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (search !== null) params.set("search", search);

            const res = await GET_LIST(makeRequest(`http://localhost/api/admin/reviews?${params}`));
            expect(res.status).toBe(403);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("GET /api/admin/reviews/[id] returns 403 for any review id when non-admin", () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), async (reviewId) => {
          const res = await GET_DETAIL(
            makeRequest(`http://localhost/api/admin/reviews/${reviewId}`),
            makeParams(reviewId)
          );
          expect(res.status).toBe(403);
        }),
        { numRuns: 100 }
      );
    });

    it("PUT /api/admin/reviews/[id] returns 403 for any review id and body when non-admin", () => {
      fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 0, max: 20 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (reviewId, rating, content) => {
            const res = await PUT(
              makeRequest(`http://localhost/api/admin/reviews/${reviewId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  rating,
                  content: `<p>${content}</p>`,
                  positivePoints: [],
                  negativePoints: [],
                }),
              }),
              makeParams(reviewId)
            );
            expect(res.status).toBe(403);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("DELETE /api/admin/reviews/[id] returns 403 for any review id when non-admin", () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), async (reviewId) => {
          const res = await DELETE_HANDLER(
            makeRequest(`http://localhost/api/admin/reviews/${reviewId}`),
            makeParams(reviewId)
          );
          expect(res.status).toBe(403);
        }),
        { numRuns: 100 }
      );
    });
  });
});
