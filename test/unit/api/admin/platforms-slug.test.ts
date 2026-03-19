/**
 * Tests for admin platforms [slug] API route (GET detail, PUT, DELETE)
 * Tests validation, not found (404), non-admin (403), cascade delete.
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

// --- Mock setup ---
let mockRequireAdmin: any;
let mockSupabaseFrom: any;

const samplePlatform = {
  id: "plat-uuid-1",
  slug: "playstation-5",
  icon_url: "https://example.com/ps5.png",
  platform_translations: [
    { platform_id: "plat-uuid-1", language_code: "fr", name: "PlayStation 5", abbreviation: "PS5" },
    { platform_id: "plat-uuid-1", language_code: "en", name: "PlayStation 5", abbreviation: "PS5" },
  ],
};

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

const {
  GET,
  PUT,
  DELETE: DELETE_HANDLER,
} = await import("../../../../src/app/api/admin/platforms/[slug]/route");

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("Admin Platforms [slug] API", () => {
  beforeEach(() => {
    mockRequireAdmin = vi.fn(() => Promise.resolve(true));
    mockSupabaseFrom = null;
  });

  // =====================
  // GET
  // =====================
  describe("GET /api/admin/platforms/[slug]", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });
      const res = await GET(
        makeRequest("http://localhost/api/admin/platforms/ps5"),
        makeParams("ps5")
      );
      expect(res.status).toBe(403);
    });

    test("returns platform with translations and gameCount", async () => {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "platforms") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: samplePlatform, error: null })),
              })),
            })),
          };
        }
        if (table === "game_platforms") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 3, error: null })),
            })),
          };
        }
        return {};
      });

      const res = await GET(
        makeRequest("http://localhost/api/admin/platforms/playstation-5"),
        makeParams("playstation-5")
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.platform.slug).toBe("playstation-5");
      expect(body.platform.gameCount).toBe(3);
      expect(body.platform.translations).toHaveLength(2);
    });

    test("returns 404 when platform not found", async () => {
      mockSupabaseFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { code: "PGRST116" } })),
          })),
        })),
      }));

      const res = await GET(
        makeRequest("http://localhost/api/admin/platforms/nope"),
        makeParams("nope")
      );
      expect(res.status).toBe(404);
    });
  });

  // =====================
  // PUT
  // =====================
  describe("PUT /api/admin/platforms/[slug]", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });
      const res = await PUT(
        makeRequest("http://localhost/api/admin/platforms/ps5", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translations: [{ language_code: "fr", name: "PS5 Modifié" }] }),
        }),
        makeParams("ps5")
      );
      expect(res.status).toBe(403);
    });

    test("returns 400 for invalid input (empty translations)", async () => {
      const res = await PUT(
        makeRequest("http://localhost/api/admin/platforms/ps5", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translations: [] }),
        }),
        makeParams("ps5")
      );
      expect(res.status).toBe(400);
    });

    test("returns 404 when platform does not exist", async () => {
      mockSupabaseFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { code: "PGRST116" } })),
          })),
        })),
      }));

      const res = await PUT(
        makeRequest("http://localhost/api/admin/platforms/nope", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translations: [{ language_code: "fr", name: "Test" }] }),
        }),
        makeParams("nope")
      );
      expect(res.status).toBe(404);
    });

    test("updates platform translations successfully", async () => {
      const updatedPlatform = {
        ...samplePlatform,
        platform_translations: [
          {
            platform_id: "plat-uuid-1",
            language_code: "fr",
            name: "PS5 Modifié",
            abbreviation: "PS5",
          },
        ],
      };
      let callCount = 0;

      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "platforms") {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({ data: { id: "plat-uuid-1" }, error: null })
                  ),
                })),
              })),
            };
          }
          if (callCount === 2) {
            return { update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })) };
          }
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: updatedPlatform, error: null })),
              })),
            })),
          };
        }
        if (table === "platform_translations") {
          return { upsert: vi.fn(() => Promise.resolve({ error: null })) };
        }
        if (table === "game_platforms") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 2, error: null })),
            })),
          };
        }
        return {};
      });

      const res = await PUT(
        makeRequest("http://localhost/api/admin/platforms/playstation-5", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            translations: [{ language_code: "fr", name: "PS5 Modifié" }],
          }),
        }),
        makeParams("playstation-5")
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.platform.translations[0].name).toBe("PS5 Modifié");
      expect(body.platform.gameCount).toBe(2);
    });
  });

  // =====================
  // DELETE
  // =====================
  describe("DELETE /api/admin/platforms/[slug]", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });
      const res = await DELETE_HANDLER(
        makeRequest("http://localhost/api/admin/platforms/ps5"),
        makeParams("ps5")
      );
      expect(res.status).toBe(403);
    });

    test("returns 404 when platform not found", async () => {
      mockSupabaseFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { code: "PGRST116" } })),
          })),
        })),
      }));

      const res = await DELETE_HANDLER(
        makeRequest("http://localhost/api/admin/platforms/nope"),
        makeParams("nope")
      );
      expect(res.status).toBe(404);
    });

    test("returns 409 when platform is in use without force", async () => {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "platforms") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: "plat-uuid-1", slug: "ps5" }, error: null })
                ),
              })),
            })),
          };
        }
        if (table === "game_platforms") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 5, error: null })),
            })),
          };
        }
        return {};
      });

      const res = await DELETE_HANDLER(
        makeRequest("http://localhost/api/admin/platforms/ps5"),
        makeParams("ps5")
      );
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.type).toBe("IN_USE");
      expect(body.usageCount).toBe(5);
    });

    test("deletes platform successfully when not in use", async () => {
      let translationsDeleted = false;
      let platformDeleted = false;

      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "platforms") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: "plat-uuid-1", slug: "ps5" }, error: null })
                ),
              })),
            })),
            delete: vi.fn(() => {
              platformDeleted = true;
              return { eq: vi.fn(() => Promise.resolve({ error: null })) };
            }),
          };
        }
        if (table === "game_platforms") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 0, error: null })),
            })),
          };
        }
        if (table === "platform_translations") {
          return {
            delete: vi.fn(() => {
              translationsDeleted = true;
              return { eq: vi.fn(() => Promise.resolve({ error: null })) };
            }),
          };
        }
        return {};
      });

      const res = await DELETE_HANDLER(
        makeRequest("http://localhost/api/admin/platforms/ps5"),
        makeParams("ps5")
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(translationsDeleted).toBe(true);
      expect(platformDeleted).toBe(true);
    });

    test("deletes platform with force=true including game_platforms cleanup", async () => {
      let gamePlatformsDeleted = false;

      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "platforms") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: "plat-uuid-1", slug: "ps5" }, error: null })
                ),
              })),
            })),
            delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
          };
        }
        if (table === "game_platforms") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 3, error: null })),
            })),
            delete: vi.fn(() => {
              gamePlatformsDeleted = true;
              return { eq: vi.fn(() => Promise.resolve({ error: null })) };
            }),
          };
        }
        if (table === "platform_translations") {
          return {
            delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
          };
        }
        return {};
      });

      const res = await DELETE_HANDLER(
        makeRequest("http://localhost/api/admin/platforms/ps5?force=true"),
        makeParams("ps5")
      );
      expect(res.status).toBe(200);
      expect(gamePlatformsDeleted).toBe(true);
    });
  });
});
