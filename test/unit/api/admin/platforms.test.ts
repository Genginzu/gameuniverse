/**
 * Tests for admin platforms API route (GET list + POST create)
 * Tests CRUD, duplicate slug (409), validation (400), non-admin (403).
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

// --- Mock setup ---
let mockRequireAdmin: any;
let mockSupabaseFrom: any;

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

const { GET, POST } = await import("../../../../src/app/api/admin/platforms/route");

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}

const samplePlatform = {
  id: "plat-uuid-1",
  slug: "playstation-5",
  icon_url: null,
  platform_translations: [
    { platform_id: "plat-uuid-1", language_code: "fr", name: "PlayStation 5", abbreviation: "PS5" },
    { platform_id: "plat-uuid-1", language_code: "en", name: "PlayStation 5", abbreviation: "PS5" },
  ],
};

describe("Admin Platforms API — GET + POST", () => {
  beforeEach(() => {
    mockRequireAdmin = vi.fn(() => Promise.resolve(true));
    mockSupabaseFrom = null;
  });

  // =====================
  // GET /api/admin/platforms
  // =====================
  describe("GET /api/admin/platforms", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });

      const res = await GET(makeRequest("http://localhost/api/admin/platforms"));
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Admin access required");
    });

    test("returns platforms with pagination structure", async () => {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "platforms") {
          return {
            select: vi.fn((_cols: string, opts?: { head?: boolean }) => {
              if (opts?.head) {
                return Promise.resolve({ count: 1, error: null });
              }
              return {
                order: vi.fn(() => ({
                  range: vi.fn(() => Promise.resolve({ data: [samplePlatform], error: null })),
                })),
              };
            }),
          };
        }
        if (table === "game_platforms") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() =>
                Promise.resolve({ data: [{ platform_id: "plat-uuid-1" }], error: null })
              ),
            })),
          };
        }
        return {};
      });

      const res = await GET(makeRequest("http://localhost/api/admin/platforms"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("platforms");
      expect(body).toHaveProperty("pagination");
      expect(body.pagination).toHaveProperty("currentPage");
      expect(body.pagination).toHaveProperty("totalPages");
      expect(body.pagination).toHaveProperty("totalCount");
      expect(body.platforms).toHaveLength(1);
      expect(body.platforms[0].slug).toBe("playstation-5");
      expect(body.platforms[0].gameCount).toBe(1);
      expect(body.platforms[0].translations).toHaveLength(2);
    });

    test("returns 500 when count query fails", async () => {
      mockSupabaseFrom = vi.fn(() => ({
        select: vi.fn((_cols: string, opts?: { head?: boolean }) => {
          if (opts?.head) {
            return Promise.resolve({ count: null, error: { message: "DB error" } });
          }
          return {
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }),
      }));

      const res = await GET(makeRequest("http://localhost/api/admin/platforms"));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Failed to count platforms");
    });

    test("returns 500 when data query fails", async () => {
      mockSupabaseFrom = vi.fn(() => ({
        select: vi.fn((_cols: string, opts?: { head?: boolean }) => {
          if (opts?.head) {
            return Promise.resolve({ count: 0, error: null });
          }
          return {
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: null, error: { message: "DB error" } })),
            })),
          };
        }),
      }));

      const res = await GET(makeRequest("http://localhost/api/admin/platforms"));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Failed to fetch platforms");
    });
  });

  // =====================
  // POST /api/admin/platforms
  // =====================
  describe("POST /api/admin/platforms", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });

      const res = await POST(
        makeRequest("http://localhost/api/admin/platforms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: "ps5",
            translations: [{ language_code: "fr", name: "PS5" }],
          }),
        })
      );
      expect(res.status).toBe(403);
    });

    test("returns 400 for invalid input (missing slug)", async () => {
      const res = await POST(
        makeRequest("http://localhost/api/admin/platforms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translations: [{ language_code: "fr", name: "PS5" }] }),
        })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid input data");
    });

    test("returns 400 for invalid input (no translations with name)", async () => {
      const res = await POST(
        makeRequest("http://localhost/api/admin/platforms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: "ps5", translations: [] }),
        })
      );
      expect(res.status).toBe(400);
    });

    test("creates platform successfully", async () => {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "platforms") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "new-uuid", slug: "ps5", icon_url: null },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        if (table === "platform_translations") {
          return { insert: vi.fn(() => Promise.resolve({ error: null })) };
        }
        return {};
      });

      const res = await POST(
        makeRequest("http://localhost/api/admin/platforms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: "ps5",
            translations: [{ language_code: "fr", name: "PlayStation 5" }],
          }),
        })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.platform.slug).toBe("ps5");
      expect(body.platform.gameCount).toBe(0);
      expect(body.platform.translations).toHaveLength(1);
    });

    test("returns 409 when slug already exists", async () => {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "platforms") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: null, error: { code: "23505", message: "duplicate" } })
                ),
              })),
            })),
          };
        }
        return {};
      });

      const res = await POST(
        makeRequest("http://localhost/api/admin/platforms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: "ps5",
            translations: [{ language_code: "fr", name: "PlayStation 5" }],
          }),
        })
      );
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toContain("already exists");
    });

    test("returns 500 and cleans up when translation insert fails", async () => {
      const deleteMock = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));

      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "platforms") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "new-uuid", slug: "ps5", icon_url: null },
                    error: null,
                  })
                ),
              })),
            })),
            delete: deleteMock,
          };
        }
        if (table === "platform_translations") {
          return { insert: vi.fn(() => Promise.resolve({ error: { message: "DB error" } })) };
        }
        return {};
      });

      const res = await POST(
        makeRequest("http://localhost/api/admin/platforms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: "ps5",
            translations: [{ language_code: "fr", name: "PlayStation 5" }],
          }),
        })
      );
      expect(res.status).toBe(500);
      expect(deleteMock).toHaveBeenCalled();
    });
  });
});
