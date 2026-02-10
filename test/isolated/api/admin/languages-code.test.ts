/**
 * Tests for admin languages [code] API route (GET detail, PUT, DELETE)
 * Tests validation, usage checks, force delete, and response structure.
 * Placed in isolated/ because mock.module() conflicts with parallel tests.
 */

import { describe, test, expect, beforeEach, mock } from "bun:test";

// --- Mock setup ---
let mockRequireAdmin: ReturnType<typeof mock>;
let mockSupabaseFrom: ReturnType<typeof mock>;

const sampleLanguage = { code: "fr", name: "French", native_name: "Français" };

// Mock modules before importing the route
mock.module("../../../../src/lib/auth-admin", () => ({
  requireAdmin: () => {
    if (mockRequireAdmin) return mockRequireAdmin();
    return Promise.resolve(true);
  },
}));

mock.module("../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (mockSupabaseFrom) return mockSupabaseFrom(table);
        return {};
      },
    }),
}));

// Import after mocks
const {
  GET,
  PUT,
  DELETE: DELETE_HANDLER,
} = await import("../../../../src/app/api/admin/languages/[code]/route");

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}

function makeParams(code: string) {
  return { params: Promise.resolve({ code }) };
}

describe("Admin Languages [code] API", () => {
  beforeEach(() => {
    mockRequireAdmin = mock(() => Promise.resolve(true));
    mockSupabaseFrom = null as unknown as ReturnType<typeof mock>;
  });

  // =====================
  // GET /api/admin/languages/[code]
  // =====================
  describe("GET /api/admin/languages/[code]", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = mock(() => {
        throw new Error("Admin access required");
      });

      const req = makeRequest("http://localhost/api/admin/languages/fr");
      const res = await GET(req, makeParams("fr"));

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Admin access required");
    });

    test("returns language when found", async () => {
      const singleMock = mock(() => Promise.resolve({ data: sampleLanguage, error: null }));
      const eqMock = mock(() => ({ single: singleMock }));
      const selectMock = mock(() => ({ eq: eqMock }));

      mockSupabaseFrom = mock(() => ({ select: selectMock }));

      const req = makeRequest("http://localhost/api/admin/languages/fr");
      const res = await GET(req, makeParams("fr"));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.language).toEqual(sampleLanguage);
      expect(body.language.code).toBe("fr");
      expect(body.language.name).toBe("French");
      expect(body.language.native_name).toBe("Français");
    });

    test("returns 404 when language not found", async () => {
      const singleMock = mock(() =>
        Promise.resolve({ data: null, error: { code: "PGRST116", message: "not found" } })
      );
      const eqMock = mock(() => ({ single: singleMock }));
      const selectMock = mock(() => ({ eq: eqMock }));

      mockSupabaseFrom = mock(() => ({ select: selectMock }));

      const req = makeRequest("http://localhost/api/admin/languages/zz");
      const res = await GET(req, makeParams("zz"));

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Language not found");
    });

    test("returns 500 on unexpected error", async () => {
      mockRequireAdmin = mock(() => Promise.resolve(true));
      mockSupabaseFrom = mock(() => {
        throw new Error("Unexpected DB error");
      });

      const req = makeRequest("http://localhost/api/admin/languages/fr");
      const res = await GET(req, makeParams("fr"));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });

  // =====================
  // PUT /api/admin/languages/[code]
  // =====================
  describe("PUT /api/admin/languages/[code]", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = mock(() => {
        throw new Error("Admin access required");
      });

      const req = makeRequest("http://localhost/api/admin/languages/fr", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "French Updated", native_name: "Français" }),
      });
      const res = await PUT(req, makeParams("fr"));

      expect(res.status).toBe(403);
    });

    test("returns 400 for invalid input data", async () => {
      const req = makeRequest("http://localhost/api/admin/languages/fr", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", native_name: "" }),
      });
      const res = await PUT(req, makeParams("fr"));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid input data");
      expect(body.details).toBeDefined();
    });

    test("returns 400 for name exceeding 100 characters", async () => {
      const req = makeRequest("http://localhost/api/admin/languages/fr", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "A".repeat(101) }),
      });
      const res = await PUT(req, makeParams("fr"));

      expect(res.status).toBe(400);
    });

    test("returns 404 when language does not exist", async () => {
      // Mock: existence check returns nothing
      const singleMock = mock(() =>
        Promise.resolve({ data: null, error: { code: "PGRST116", message: "not found" } })
      );
      const eqMock = mock(() => ({ single: singleMock }));
      const selectMock = mock(() => ({ eq: eqMock }));

      mockSupabaseFrom = mock(() => ({ select: selectMock }));

      const req = makeRequest("http://localhost/api/admin/languages/zz", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Unknown", native_name: "Unknown" }),
      });
      const res = await PUT(req, makeParams("zz"));

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Language not found");
    });

    test("updates language successfully", async () => {
      const updatedLang = { code: "fr", name: "French Updated", native_name: "Français Modifié" };
      let callCount = 0;

      mockSupabaseFrom = mock(() => {
        callCount++;
        if (callCount === 1) {
          // First call: existence check
          return {
            select: mock(() => ({
              eq: mock(() => ({
                single: mock(() => Promise.resolve({ data: { code: "fr" }, error: null })),
              })),
            })),
          };
        }
        // Second call: update
        return {
          update: mock(() => ({
            eq: mock(() => ({
              select: mock(() => ({
                single: mock(() => Promise.resolve({ data: updatedLang, error: null })),
              })),
            })),
          })),
        };
      });

      const req = makeRequest("http://localhost/api/admin/languages/fr", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "French Updated", native_name: "Français Modifié" }),
      });
      const res = await PUT(req, makeParams("fr"));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.language).toEqual(updatedLang);
    });

    test("converts empty native_name to null", async () => {
      let updateCalledWith: unknown = null;
      let callCount = 0;

      mockSupabaseFrom = mock(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: mock(() => ({
              eq: mock(() => ({
                single: mock(() => Promise.resolve({ data: { code: "fr" }, error: null })),
              })),
            })),
          };
        }
        return {
          update: mock((data: unknown) => {
            updateCalledWith = data;
            return {
              eq: mock(() => ({
                select: mock(() => ({
                  single: mock(() =>
                    Promise.resolve({
                      data: { code: "fr", name: "French", native_name: null },
                      error: null,
                    })
                  ),
                })),
              })),
            };
          }),
        };
      });

      const req = makeRequest("http://localhost/api/admin/languages/fr", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "French", native_name: "" }),
      });
      const res = await PUT(req, makeParams("fr"));

      expect(res.status).toBe(200);
      expect(updateCalledWith).toEqual({ name: "French", native_name: null });
    });

    test("returns 500 when update fails", async () => {
      let callCount = 0;

      mockSupabaseFrom = mock(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: mock(() => ({
              eq: mock(() => ({
                single: mock(() => Promise.resolve({ data: { code: "fr" }, error: null })),
              })),
            })),
          };
        }
        return {
          update: mock(() => ({
            eq: mock(() => ({
              select: mock(() => ({
                single: mock(() => Promise.resolve({ data: null, error: { message: "DB error" } })),
              })),
            })),
          })),
        };
      });

      const req = makeRequest("http://localhost/api/admin/languages/fr", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "French", native_name: "Français" }),
      });
      const res = await PUT(req, makeParams("fr"));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Failed to update language");
    });
  });

  // =====================
  // DELETE /api/admin/languages/[code]
  // =====================
  describe("DELETE /api/admin/languages/[code]", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = mock(() => {
        throw new Error("Admin access required");
      });

      const req = makeRequest("http://localhost/api/admin/languages/fr");
      const res = await DELETE_HANDLER(req, makeParams("fr"));

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Admin access required");
    });

    test("returns 404 when language does not exist", async () => {
      const singleMock = mock(() =>
        Promise.resolve({ data: null, error: { code: "PGRST116", message: "not found" } })
      );
      const eqMock = mock(() => ({ single: singleMock }));
      const selectMock = mock(() => ({ eq: eqMock }));

      mockSupabaseFrom = mock(() => ({ select: selectMock }));

      const req = makeRequest("http://localhost/api/admin/languages/zz");
      const res = await DELETE_HANDLER(req, makeParams("zz"));

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Language not found");
    });

    test("returns 409 when language is in use without force", async () => {
      let callCount = 0;

      mockSupabaseFrom = mock((table: string) => {
        callCount++;
        if (table === "supported_languages") {
          // Existence check
          return {
            select: mock(() => ({
              eq: mock(() => ({
                single: mock(() => Promise.resolve({ data: sampleLanguage, error: null })),
              })),
            })),
          };
        }
        if (table === "game_languages") {
          // Usage check - language used by 3 games
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ count: 3, error: null })),
            })),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/languages/fr");
      const res = await DELETE_HANDLER(req, makeParams("fr"));

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe("Language is in use");
      expect(body.type).toBe("IN_USE");
      expect(body.usageCount).toBe(3);
      expect(body.message).toContain("3 game(s)");
    });

    test("deletes language successfully when not in use", async () => {
      mockSupabaseFrom = mock((table: string) => {
        if (table === "supported_languages") {
          return {
            select: mock(() => ({
              eq: mock(() => ({
                single: mock(() => Promise.resolve({ data: sampleLanguage, error: null })),
              })),
            })),
            delete: mock(() => ({
              eq: mock(() => Promise.resolve({ error: null })),
            })),
          };
        }
        if (table === "game_languages") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ count: 0, error: null })),
            })),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/languages/fr");
      const res = await DELETE_HANDLER(req, makeParams("fr"));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    test("deletes language with force=true even when in use", async () => {
      let gameLanguagesDeleteCalled = false;

      mockSupabaseFrom = mock((table: string) => {
        if (table === "supported_languages") {
          return {
            select: mock(() => ({
              eq: mock(() => ({
                single: mock(() => Promise.resolve({ data: sampleLanguage, error: null })),
              })),
            })),
            delete: mock(() => ({
              eq: mock(() => Promise.resolve({ error: null })),
            })),
          };
        }
        if (table === "game_languages") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ count: 5, error: null })),
            })),
            delete: mock(() => {
              gameLanguagesDeleteCalled = true;
              return {
                eq: mock(() => Promise.resolve({ error: null })),
              };
            }),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/languages/fr?force=true");
      const res = await DELETE_HANDLER(req, makeParams("fr"));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(gameLanguagesDeleteCalled).toBe(true);
    });

    test("returns 500 when usage check fails", async () => {
      mockSupabaseFrom = mock((table: string) => {
        if (table === "supported_languages") {
          return {
            select: mock(() => ({
              eq: mock(() => ({
                single: mock(() => Promise.resolve({ data: sampleLanguage, error: null })),
              })),
            })),
          };
        }
        if (table === "game_languages") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ count: null, error: { message: "DB error" } })),
            })),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/languages/fr");
      const res = await DELETE_HANDLER(req, makeParams("fr"));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Failed to check language usage");
    });

    test("returns 500 when delete operation fails", async () => {
      mockSupabaseFrom = mock((table: string) => {
        if (table === "supported_languages") {
          return {
            select: mock(() => ({
              eq: mock(() => ({
                single: mock(() => Promise.resolve({ data: sampleLanguage, error: null })),
              })),
            })),
            delete: mock(() => ({
              eq: mock(() => Promise.resolve({ error: { message: "DB error" } })),
            })),
          };
        }
        if (table === "game_languages") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ count: 0, error: null })),
            })),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/languages/fr");
      const res = await DELETE_HANDLER(req, makeParams("fr"));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Failed to delete language");
    });

    test("returns 500 when force cleanup of game_languages fails", async () => {
      mockSupabaseFrom = mock((table: string) => {
        if (table === "supported_languages") {
          return {
            select: mock(() => ({
              eq: mock(() => ({
                single: mock(() => Promise.resolve({ data: sampleLanguage, error: null })),
              })),
            })),
          };
        }
        if (table === "game_languages") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ count: 2, error: null })),
            })),
            delete: mock(() => ({
              eq: mock(() => Promise.resolve({ error: { message: "cleanup error" } })),
            })),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/languages/fr?force=true");
      const res = await DELETE_HANDLER(req, makeParams("fr"));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Failed to remove language references from games");
    });
  });
});
