/**
 * Tests for admin languages API route (GET + POST)
 * Tests validation, query parameters, and response structure.
 * Placed in isolated/ because mock.module() conflicts with parallel tests.
 */

import { describe, test, expect, beforeEach, mock } from "bun:test";
import { z } from "zod";

// --- Query schema (mirrors the one in route.ts) ---
const languageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z.enum(["code", "name"]).default("code"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

// --- Mock setup ---
let mockRequireAdmin: ReturnType<typeof mock>;
let mockSupabaseFrom: ReturnType<typeof mock>;
let mockLanguagesData: Array<{ code: string; name: string; native_name: string | null }>;

const createMockChain = (overrides: Record<string, unknown> = {}) => {
  const defaultResult = {
    data: mockLanguagesData,
    error: null,
    count: mockLanguagesData.length,
  };
  const merged = { ...defaultResult, ...overrides };

  return {
    select: mock((_cols: string, _opts?: unknown) => {
      const chain = {
        or: mock(() => chain),
        order: mock(() => chain),
        range: mock(() => Promise.resolve({ data: merged.data, error: merged.error })),
        // For count queries (head: true)
        ...((_opts as { head?: boolean })?.head
          ? { or: mock(() => Promise.resolve({ count: merged.count, error: merged.error })) }
          : {}),
      };
      // If head query, resolve directly with count
      if ((_opts as { head?: boolean })?.head) {
        const headChain = {
          or: mock(() => Promise.resolve({ count: merged.count, error: merged.error })),
        };
        return Object.assign(
          Promise.resolve({ count: merged.count, error: merged.error }),
          headChain
        );
      }
      return chain;
    }),
  };
};

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
        return createMockChain();
      },
    }),
}));

// Import after mocks
const { GET, POST } = await import("../../../../src/app/api/admin/languages/route");

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}

describe("Admin Languages API", () => {
  beforeEach(() => {
    mockRequireAdmin = mock(() => Promise.resolve(true));
    mockLanguagesData = [
      { code: "en", name: "English", native_name: "English" },
      { code: "fr", name: "French", native_name: "Français" },
      { code: "ja", name: "Japanese", native_name: "日本語" },
    ];
    mockSupabaseFrom = null as unknown as ReturnType<typeof mock>;
  });

  describe("Query Parameter Validation", () => {
    test("accepts valid default parameters", () => {
      const result = languageQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sort_by).toBe("code");
        expect(result.data.sort_order).toBe("asc");
      }
    });

    test("accepts valid custom parameters", () => {
      const result = languageQuerySchema.safeParse({
        page: "2",
        limit: "50",
        search: "french",
        sort_by: "name",
        sort_order: "desc",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
        expect(result.data.search).toBe("french");
        expect(result.data.sort_by).toBe("name");
        expect(result.data.sort_order).toBe("desc");
      }
    });

    test("rejects page less than 1", () => {
      const result = languageQuerySchema.safeParse({ page: "0" });
      expect(result.success).toBe(false);
    });

    test("rejects limit greater than 100", () => {
      const result = languageQuerySchema.safeParse({ limit: "101" });
      expect(result.success).toBe(false);
    });

    test("rejects invalid sort_by value", () => {
      const result = languageQuerySchema.safeParse({ sort_by: "invalid" });
      expect(result.success).toBe(false);
    });

    test("rejects invalid sort_order value", () => {
      const result = languageQuerySchema.safeParse({ sort_order: "random" });
      expect(result.success).toBe(false);
    });
  });

  describe("GET /api/admin/languages", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = mock(() => {
        throw new Error("Admin access required");
      });

      const req = makeRequest("http://localhost/api/admin/languages");
      const res = await GET(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Admin access required");
    });

    test("returns languages with pagination structure", async () => {
      const selectMock = mock((_cols: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head) {
          return {
            or: mock(() => Promise.resolve({ count: 3, error: null })),
          };
        }
        return {
          or: mock(() => ({
            order: mock(() => ({
              range: mock(() => Promise.resolve({ data: mockLanguagesData, error: null })),
            })),
          })),
          order: mock(() => ({
            range: mock(() => Promise.resolve({ data: mockLanguagesData, error: null })),
          })),
        };
      });

      mockSupabaseFrom = mock(() => ({ select: selectMock }));

      const req = makeRequest("http://localhost/api/admin/languages");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("languages");
      expect(body).toHaveProperty("pagination");
      expect(body.pagination).toHaveProperty("currentPage");
      expect(body.pagination).toHaveProperty("totalPages");
      expect(body.pagination).toHaveProperty("totalCount");
      expect(body.pagination).toHaveProperty("limit");
      expect(body.pagination).toHaveProperty("hasNextPage");
      expect(body.pagination).toHaveProperty("hasPreviousPage");
    });

    test("returns languages with correct data shape", async () => {
      const selectMock = mock((_cols: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head) {
          return {
            or: mock(() => Promise.resolve({ count: 3, error: null })),
          };
        }
        return {
          order: mock(() => ({
            range: mock(() => Promise.resolve({ data: mockLanguagesData, error: null })),
          })),
        };
      });

      mockSupabaseFrom = mock(() => ({ select: selectMock }));

      const req = makeRequest("http://localhost/api/admin/languages");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.languages).toHaveLength(3);
      expect(body.languages[0]).toHaveProperty("code");
      expect(body.languages[0]).toHaveProperty("name");
      expect(body.languages[0]).toHaveProperty("native_name");
    });

    test("applies search filter via or clause", async () => {
      const orMock = mock((_filter: string) => ({
        order: mock(() => ({
          range: mock(() =>
            Promise.resolve({
              data: [{ code: "fr", name: "French", native_name: "Français" }],
              error: null,
            })
          ),
        })),
      }));

      const countOrMock = mock(() => Promise.resolve({ count: 1, error: null }));

      const selectMock = mock((_cols: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head) {
          return { or: countOrMock };
        }
        return { or: orMock };
      });

      mockSupabaseFrom = mock(() => ({ select: selectMock }));

      const req = makeRequest("http://localhost/api/admin/languages?search=fr");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.languages).toHaveLength(1);
      // Verify or() was called with the search filter
      expect(orMock).toHaveBeenCalled();
      expect(countOrMock).toHaveBeenCalled();
    });

    test("returns 500 when database count fails", async () => {
      const selectMock = mock((_cols: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head) {
          return Promise.resolve({ count: null, error: { message: "DB error" } });
        }
        return {
          order: mock(() => ({
            range: mock(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      });

      mockSupabaseFrom = mock(() => ({ select: selectMock }));

      const req = makeRequest("http://localhost/api/admin/languages");
      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Failed to count languages");
    });

    test("returns 500 when database fetch fails", async () => {
      const selectMock = mock((_cols: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head) {
          return Promise.resolve({ count: 0, error: null });
        }
        return {
          order: mock(() => ({
            range: mock(() => Promise.resolve({ data: null, error: { message: "DB error" } })),
          })),
        };
      });

      mockSupabaseFrom = mock(() => ({ select: selectMock }));

      const req = makeRequest("http://localhost/api/admin/languages");
      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Failed to fetch languages");
    });
  });

  describe("POST /api/admin/languages", () => {
    test("returns 403 when user is not admin", async () => {
      mockRequireAdmin = mock(() => {
        throw new Error("Admin access required");
      });

      const req = makeRequest("http://localhost/api/admin/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "de", name: "German" }),
      });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Admin access required");
    });

    test("returns 400 for invalid input data", async () => {
      const req = makeRequest("http://localhost/api/admin/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "", name: "" }),
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid input data");
      expect(body.details).toBeDefined();
    });

    test("returns 400 for code with invalid characters", async () => {
      const req = makeRequest("http://localhost/api/admin/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "EN_US", name: "English US" }),
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    test("returns 400 for code that is too short", async () => {
      const req = makeRequest("http://localhost/api/admin/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "e", name: "English" }),
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    test("returns 400 for name exceeding 100 characters", async () => {
      const req = makeRequest("http://localhost/api/admin/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "xx", name: "A".repeat(101) }),
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    test("creates language successfully with valid data", async () => {
      const newLang = { code: "de", name: "German", native_name: "Deutsch" };

      const singleMock = mock(() => Promise.resolve({ data: newLang, error: null }));
      const selectMock = mock(() => ({ single: singleMock }));
      const insertMock = mock(() => ({ select: selectMock }));

      mockSupabaseFrom = mock(() => ({ insert: insertMock }));

      const req = makeRequest("http://localhost/api/admin/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLang),
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.language).toEqual(newLang);
    });

    test("creates language with empty native_name as null", async () => {
      const inputData = { code: "de", name: "German", native_name: "" };
      const expectedData = { code: "de", name: "German", native_name: null };

      const singleMock = mock(() => Promise.resolve({ data: expectedData, error: null }));
      const selectMock = mock(() => ({ single: singleMock }));
      const insertMock = mock((_data: unknown) => ({ select: selectMock }));

      mockSupabaseFrom = mock(() => ({ insert: insertMock }));

      const req = makeRequest("http://localhost/api/admin/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputData),
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      // Verify insert was called with null for empty native_name
      expect(insertMock).toHaveBeenCalledWith([{ code: "de", name: "German", native_name: null }]);
    });

    test("returns 409 when language code already exists", async () => {
      const singleMock = mock(() =>
        Promise.resolve({
          data: null,
          error: { code: "23505", message: "duplicate key" },
        })
      );
      const selectMock = mock(() => ({ single: singleMock }));
      const insertMock = mock(() => ({ select: selectMock }));

      mockSupabaseFrom = mock(() => ({ insert: insertMock }));

      const req = makeRequest("http://localhost/api/admin/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "en", name: "English" }),
      });
      const res = await POST(req);

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toContain("already exists");
    });

    test("returns 500 when database insert fails", async () => {
      const singleMock = mock(() =>
        Promise.resolve({
          data: null,
          error: { code: "PGRST000", message: "DB error" },
        })
      );
      const selectMock = mock(() => ({ single: singleMock }));
      const insertMock = mock(() => ({ select: selectMock }));

      mockSupabaseFrom = mock(() => ({ insert: insertMock }));

      const req = makeRequest("http://localhost/api/admin/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "xx", name: "Test Language" }),
      });
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Failed to create language");
    });
  });
});
