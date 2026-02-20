/**
 * Tests for admin genres [slug] API route (GET detail, PUT, DELETE)
 * Tests validation, usage checks, force delete, cascade, and response structure.
 * Placed in isolated/ because vi.mock() conflicts with parallel tests.
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

// --- Mock setup ---
let mockRequireAdmin: ReturnType<typeof mock>;
let mockSupabaseFrom: ReturnType<typeof mock>;

const sampleGenre = {
  id: "genre-uuid-1",
  slug: "tower-defense",
  genre_translations: [
    {
      genre_id: "genre-uuid-1",
      language_code: "fr",
      name: "Tower Defense",
      description: "Un genre TD",
    },
    {
      genre_id: "genre-uuid-1",
      language_code: "en",
      name: "Tower Defense",
      description: "A TD genre",
    },
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
} = await import("../../../../src/app/api/admin/genres/[slug]/route");

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("Admin Genres [slug] API", () => {
  beforeEach(() => {
    mockRequireAdmin = vi.fn(() => Promise.resolve(true));
    mockSupabaseFrom = null as unknown as ReturnType<typeof mock>;
  });

  // =====================
  // GET /api/admin/genres/[slug]
  // =====================
  describe("GET /api/admin/genres/[slug]", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });

      const req = makeRequest("http://localhost/api/admin/genres/tower-defense");
      const res = await GET(req, makeParams("tower-defense"));

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Admin access required");
    });

    test("returns genre with translations and gameCount when found", async () => {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: sampleGenre, error: null })),
              })),
            })),
          };
        }
        if (table === "game_genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 5, error: null })),
            })),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/genres/tower-defense");
      const res = await GET(req, makeParams("tower-defense"));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.genre.slug).toBe("tower-defense");
      expect(body.genre.gameCount).toBe(5);
      expect(body.genre.translations).toHaveLength(2);
      expect(body.genre.translations[0].language_code).toBe("fr");
      expect(body.genre.translations[0].name).toBe("Tower Defense");
    });

    test("returns 404 when genre not found", async () => {
      const singleMock = vi.fn(() =>
        Promise.resolve({ data: null, error: { code: "PGRST116", message: "not found" } })
      );
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));

      mockSupabaseFrom = vi.fn(() => ({ select: selectMock }));

      const req = makeRequest("http://localhost/api/admin/genres/nonexistent");
      const res = await GET(req, makeParams("nonexistent"));

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Genre not found");
    });

    test("returns 500 on unexpected error", async () => {
      mockSupabaseFrom = vi.fn(() => {
        throw new Error("Unexpected DB error");
      });

      const req = makeRequest("http://localhost/api/admin/genres/tower-defense");
      const res = await GET(req, makeParams("tower-defense"));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });

  // =====================
  // PUT /api/admin/genres/[slug]
  // =====================
  describe("PUT /api/admin/genres/[slug]", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });

      const req = makeRequest("http://localhost/api/admin/genres/tower-defense", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translations: [{ language_code: "fr", name: "TD Modifié", description: "" }],
        }),
      });
      const res = await PUT(req, makeParams("tower-defense"));

      expect(res.status).toBe(403);
    });

    test("returns 400 for invalid input (empty translations)", async () => {
      const req = makeRequest("http://localhost/api/admin/genres/tower-defense", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translations: [] }),
      });
      const res = await PUT(req, makeParams("tower-defense"));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid input data");
      expect(body.details).toBeDefined();
    });

    test("returns 400 for translation with empty name", async () => {
      const req = makeRequest("http://localhost/api/admin/genres/tower-defense", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translations: [{ language_code: "fr", name: "", description: "" }],
        }),
      });
      const res = await PUT(req, makeParams("tower-defense"));

      expect(res.status).toBe(400);
    });

    test("returns 404 when genre does not exist", async () => {
      const singleMock = vi.fn(() =>
        Promise.resolve({ data: null, error: { code: "PGRST116", message: "not found" } })
      );
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));

      mockSupabaseFrom = vi.fn(() => ({ select: selectMock }));

      const req = makeRequest("http://localhost/api/admin/genres/nonexistent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translations: [{ language_code: "fr", name: "Test", description: "" }],
        }),
      });
      const res = await PUT(req, makeParams("nonexistent"));

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Genre not found");
    });

    test("updates genre translations successfully via upsert", async () => {
      const updatedGenre = {
        id: "genre-uuid-1",
        slug: "tower-defense",
        genre_translations: [
          {
            genre_id: "genre-uuid-1",
            language_code: "fr",
            name: "TD Modifié",
            description: "Nouvelle desc",
          },
        ],
      };
      let callCount = 0;

      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "genres") {
          callCount++;
          if (callCount === 1) {
            // Existence check
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({ data: { id: "genre-uuid-1" }, error: null })
                  ),
                })),
              })),
            };
          }
          // Fetch updated genre
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: updatedGenre, error: null })),
              })),
            })),
          };
        }
        if (table === "genre_translations") {
          return {
            upsert: vi.fn(() => Promise.resolve({ error: null })),
          };
        }
        if (table === "game_genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 2, error: null })),
            })),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/genres/tower-defense", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translations: [{ language_code: "fr", name: "TD Modifié", description: "Nouvelle desc" }],
        }),
      });
      const res = await PUT(req, makeParams("tower-defense"));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.genre.slug).toBe("tower-defense");
      expect(body.genre.gameCount).toBe(2);
      expect(body.genre.translations[0].name).toBe("TD Modifié");
    });

    test("returns 500 when upsert fails", async () => {
      let callCount = 0;

      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "genres") {
          callCount++;
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { id: "genre-uuid-1" }, error: null })),
              })),
            })),
          };
        }
        if (table === "genre_translations") {
          return {
            upsert: vi.fn(() => Promise.resolve({ error: { message: "DB error" } })),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/genres/tower-defense", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translations: [{ language_code: "fr", name: "Test", description: "" }],
        }),
      });
      const res = await PUT(req, makeParams("tower-defense"));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Failed to update genre translations");
    });
  });

  // =====================
  // DELETE /api/admin/genres/[slug]
  // =====================
  describe("DELETE /api/admin/genres/[slug]", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });

      const req = makeRequest("http://localhost/api/admin/genres/tower-defense");
      const res = await DELETE_HANDLER(req, makeParams("tower-defense"));

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Admin access required");
    });

    test("returns 404 when genre does not exist", async () => {
      const singleMock = vi.fn(() =>
        Promise.resolve({ data: null, error: { code: "PGRST116", message: "not found" } })
      );
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));

      mockSupabaseFrom = vi.fn(() => ({ select: selectMock }));

      const req = makeRequest("http://localhost/api/admin/genres/nonexistent");
      const res = await DELETE_HANDLER(req, makeParams("nonexistent"));

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Genre not found");
    });

    test("returns 409 when genre is in use without force", async () => {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "genre-uuid-1", slug: "tower-defense" },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        if (table === "game_genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 3, error: null })),
            })),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/genres/tower-defense");
      const res = await DELETE_HANDLER(req, makeParams("tower-defense"));

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe("Genre is in use");
      expect(body.type).toBe("IN_USE");
      expect(body.usageCount).toBe(3);
      expect(body.message).toContain("3 game(s)");
    });

    test("deletes genre successfully when not in use (cascade: translations then genre)", async () => {
      let translationsDeleted = false;
      let genreDeleted = false;

      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "genre-uuid-1", slug: "tower-defense" },
                    error: null,
                  })
                ),
              })),
            })),
            delete: vi.fn(() => {
              genreDeleted = true;
              return { eq: vi.fn(() => Promise.resolve({ error: null })) };
            }),
          };
        }
        if (table === "game_genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 0, error: null })),
            })),
          };
        }
        if (table === "genre_translations") {
          return {
            delete: vi.fn(() => {
              translationsDeleted = true;
              return { eq: vi.fn(() => Promise.resolve({ error: null })) };
            }),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/genres/tower-defense");
      const res = await DELETE_HANDLER(req, makeParams("tower-defense"));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(translationsDeleted).toBe(true);
      expect(genreDeleted).toBe(true);
    });

    test("deletes genre with force=true: game_genres, translations, then genre", async () => {
      let gameGenresDeleted = false;
      let translationsDeleted = false;
      let genreDeleted = false;

      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "genre-uuid-1", slug: "tower-defense" },
                    error: null,
                  })
                ),
              })),
            })),
            delete: vi.fn(() => {
              genreDeleted = true;
              return { eq: vi.fn(() => Promise.resolve({ error: null })) };
            }),
          };
        }
        if (table === "game_genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 5, error: null })),
            })),
            delete: vi.fn(() => {
              gameGenresDeleted = true;
              return { eq: vi.fn(() => Promise.resolve({ error: null })) };
            }),
          };
        }
        if (table === "genre_translations") {
          return {
            delete: vi.fn(() => {
              translationsDeleted = true;
              return { eq: vi.fn(() => Promise.resolve({ error: null })) };
            }),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/genres/tower-defense?force=true");
      const res = await DELETE_HANDLER(req, makeParams("tower-defense"));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(gameGenresDeleted).toBe(true);
      expect(translationsDeleted).toBe(true);
      expect(genreDeleted).toBe(true);
    });

    test("returns 500 when usage check fails", async () => {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "genre-uuid-1", slug: "tower-defense" },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        if (table === "game_genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: null, error: { message: "DB error" } })),
            })),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/genres/tower-defense");
      const res = await DELETE_HANDLER(req, makeParams("tower-defense"));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Failed to check genre usage");
    });

    test("returns 500 when force cleanup of game_genres fails", async () => {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "genre-uuid-1", slug: "tower-defense" },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        if (table === "game_genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 2, error: null })),
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: { message: "cleanup error" } })),
            })),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/genres/tower-defense?force=true");
      const res = await DELETE_HANDLER(req, makeParams("tower-defense"));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Failed to remove genre references from games");
    });

    test("returns 500 when translation delete fails", async () => {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "genre-uuid-1", slug: "tower-defense" },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        if (table === "game_genres") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 0, error: null })),
            })),
          };
        }
        if (table === "genre_translations") {
          return {
            delete: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: { message: "delete error" } })),
            })),
          };
        }
        return {};
      });

      const req = makeRequest("http://localhost/api/admin/genres/tower-defense");
      const res = await DELETE_HANDLER(req, makeParams("tower-defense"));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Failed to delete genre translations");
    });
  });
});
