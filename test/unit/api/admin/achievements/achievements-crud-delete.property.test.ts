/**
 * Property-based tests for achievements CRUD API — Properties 7, 8, 9.
 *
 * Uses fc.sample() + sequential for-loops to avoid concurrency issues
 * with shared mutable mocks (mockSupabaseFrom).
 *
 * **Validates: Requirements 4.2, 4.4, 5.1, 5.2, 8.13**
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import {
  validKeyGen,
  delReq,
  usageReq,
  ctx,
  makeReq,
  mockEqMaybe,
} from "./achievements-crud-helpers";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockSupabaseFrom: ReturnType<typeof vi.fn> | null;

vi.mock("@/lib/auth-admin", () => ({
  requireAdmin: () => (mockRequireAdmin ? mockRequireAdmin() : Promise.resolve(true)),
}));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({ from: (t: string) => (mockSupabaseFrom ? mockSupabaseFrom(t) : {}) }),
}));
vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { GET, POST } = await import("@/app/api/admin/achievements/route");
const { GET: GET_ID, PUT, DELETE: DEL } = await import("@/app/api/admin/achievements/[id]/route");
const { GET: GET_USAGE } = await import("@/app/api/admin/achievements/[id]/usage/route");

beforeEach(() => {
  mockRequireAdmin = vi.fn(() => Promise.resolve(true));
  mockSupabaseFrom = null;
});

const ID = "11111111-2222-3333-4444-555555555555";

describe("Achievements CRUD Properties 7, 8, 9", () => {
  /**
   * Property 7: Usage count accuracy
   * _For any_ achievement, usage count equals the mocked player_achievements count.
   * **Validates: Requirements 4.2**
   */
  it("P7: usage count matches player_achievements row count", async () => {
    const samples = fc.sample(fc.tuple(validKeyGen, fc.integer({ min: 0, max: 500 })), 100);
    for (const [key, expectedCount] of samples) {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "achievement_catalog") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() => Promise.resolve({ data: { key }, error: null })),
              })),
            })),
          };
        }
        // player_achievements count
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ count: expectedCount, error: null })),
          })),
        };
      });

      const res = await GET_USAGE(usageReq(ID), ctx(ID));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.usageCount).toBe(expectedCount);
    }
  });

  /**
   * Property 8: Delete with player usage requires force flag
   * **Validates: Requirements 4.4**
   */
  describe("P8: Delete with player usage requires force flag", () => {
    it("DELETE without force returns 409 with usageCount when in use", async () => {
      const samples = fc.sample(fc.tuple(validKeyGen, fc.integer({ min: 1, max: 500 })), 100);
      for (const [key, usageCount] of samples) {
        mockSupabaseFrom = vi.fn((table: string) => {
          if (table === "achievement_catalog") {
            return mockEqMaybe({ id: ID, key });
          }
          // player_achievements count > 0
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: usageCount, error: null })),
            })),
          };
        });

        const res = await DEL(delReq(ID, false), ctx(ID));
        expect(res.status).toBe(409);
        const body = await res.json();
        expect(body.error).toBe("Achievement in use");
        expect(body.usageCount).toBe(usageCount);
      }
    });

    it("DELETE with force=true succeeds even when in use", async () => {
      const samples = fc.sample(validKeyGen, 100);
      for (const key of samples) {
        mockSupabaseFrom = vi.fn((table: string) => {
          if (table === "achievement_catalog") {
            return {
              ...mockEqMaybe({ id: ID, key }),
              delete: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null })),
              })),
            };
          }
          return {};
        });

        const res = await DEL(delReq(ID, true), ctx(ID));
        expect(res.status).toBe(200);
        expect((await res.json()).success).toBe(true);
      }
    });
  });

  /**
   * Property 9: All admin endpoints require authentication
   * _For any_ endpoint and HTTP method, request without admin auth returns 403.
   * **Validates: Requirements 5.1, 5.2, 8.13**
   */
  it("P9: all endpoints return 403 without admin auth", async () => {
    const BASE = "http://localhost/api/admin/achievements";
    const endpoints = [
      { name: "GET /achievements", fn: () => GET(makeReq(BASE)) },
      {
        name: "POST /achievements",
        fn: () =>
          POST(
            makeReq(BASE, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: "test" }),
            })
          ),
      },
      { name: "GET /achievements/[id]", fn: () => GET_ID(makeReq(`${BASE}/${ID}`), ctx(ID)) },
      {
        name: "PUT /achievements/[id]",
        fn: () =>
          PUT(
            makeReq(`${BASE}/${ID}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: "test" }),
            }),
            ctx(ID)
          ),
      },
      {
        name: "DELETE /achievements/[id]",
        fn: () => DEL(makeReq(`${BASE}/${ID}`, { method: "DELETE" }), ctx(ID)),
      },
      {
        name: "GET /achievements/[id]/usage",
        fn: () => GET_USAGE(makeReq(`${BASE}/${ID}/usage`), ctx(ID)),
      },
    ];

    const samples = fc.sample(fc.constantFrom(...endpoints), 100);
    for (const endpoint of samples) {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });

      const res = await endpoint.fn();
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Admin access required");
    }
  });
});
