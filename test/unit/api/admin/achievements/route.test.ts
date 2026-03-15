/**
 * Unit tests for GET/POST /api/admin/achievements
 * Tests auth protection, validation, duplicate key, pagination, and creation.
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

// --- Mutable mock references ---
let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockSupabaseFrom: ReturnType<typeof vi.fn> | null;

// --- Mock modules ---
vi.mock("@/lib/auth-admin", () => ({
  requireAdmin: () => {
    if (mockRequireAdmin) return mockRequireAdmin();
    return Promise.resolve(true);
  },
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (mockSupabaseFrom) return mockSupabaseFrom(table);
        return {};
      },
    }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Import after mocks
const { GET, POST } = await import("../../../../../src/app/api/admin/achievements/route");

const BASE_URL = "http://localhost/api/admin/achievements";

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}

const VALID_ACHIEVEMENT = {
  key: "first_game",
  category: "library",
  tier: "bronze",
  threshold: 1,
  xpValue: 50,
  icon: "trophy",
  nameFr: "Premier jeu",
  nameEn: "First game",
  descriptionFr: "Ajoutez votre premier jeu",
  descriptionEn: "Add your first game",
  sortOrder: 1,
};

const MOCK_ROW = {
  id: "aaaa-bbbb-cccc-dddd",
  key: "first_game",
  category: "library",
  tier: "bronze",
  threshold: 1,
  xp_value: 50,
  icon: "trophy",
  name_fr: "Premier jeu",
  name_en: "First game",
  description_fr: "Ajoutez votre premier jeu",
  description_en: "Add your first game",
  sort_order: 1,
};

describe("Admin Achievements API — GET/POST", () => {
  beforeEach(() => {
    mockRequireAdmin = vi.fn(() => Promise.resolve(true));
    mockSupabaseFrom = null;
  });

  // --- GET ---

  describe("GET /api/admin/achievements", () => {
    test("returns 403 when not admin", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });

      const res = await GET(makeRequest(BASE_URL));
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe("Admin access required");
    });

    test("returns paginated achievements", async () => {
      const selectMock = vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head) {
          // Count query: no search → applySearchFilter returns as-is → awaited
          const result = { count: 1, error: null };
          return Object.assign(Promise.resolve(result), result);
        }
        // Data query: no search → returned as-is → .order().range()
        return {
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ data: [MOCK_ROW], error: null })),
          })),
        };
      });
      mockSupabaseFrom = vi.fn(() => ({ select: selectMock }));

      const res = await GET(makeRequest(BASE_URL));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.achievements).toHaveLength(1);
      expect(body.achievements[0].key).toBe("first_game");
      expect(body.achievements[0].xpValue).toBe(50);
      expect(body.pagination).toMatchObject({
        currentPage: 1,
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    test("filters by search term via or clause", async () => {
      const orMock = vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: [MOCK_ROW], error: null })),
        })),
      }));
      const countOrMock = vi.fn(() => Promise.resolve({ count: 1, error: null }));

      const selectMock = vi.fn((_cols: string, opts?: { head?: boolean }) => {
        if (opts?.head) return { or: countOrMock };
        return { or: orMock };
      });
      mockSupabaseFrom = vi.fn(() => ({ select: selectMock }));

      const res = await GET(makeRequest(`${BASE_URL}?search=first`));
      expect(res.status).toBe(200);
      expect(orMock).toHaveBeenCalled();
      expect(countOrMock).toHaveBeenCalled();
    });
  });

  // --- POST ---

  describe("POST /api/admin/achievements", () => {
    test("returns 403 when not admin", async () => {
      mockRequireAdmin = vi.fn(() => {
        throw new Error("Admin access required");
      });

      const res = await POST(
        makeRequest(BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(VALID_ACHIEVEMENT),
        })
      );
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe("Admin access required");
    });

    test("returns 400 for invalid data (missing key)", async () => {
      const res = await POST(
        makeRequest(BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...VALID_ACHIEVEMENT, key: "" }),
        })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid input data");
      expect(body.details).toBeDefined();
    });

    test("returns 400 for negative threshold", async () => {
      const res = await POST(
        makeRequest(BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...VALID_ACHIEVEMENT, threshold: -1 }),
        })
      );
      expect(res.status).toBe(400);
    });

    test("returns 409 for duplicate key", async () => {
      // maybeSingle returns existing row → duplicate
      const maybeSingleMock = vi.fn(() =>
        Promise.resolve({ data: { id: "existing-id" }, error: null })
      );
      const selectMock = vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: maybeSingleMock })),
      }));
      mockSupabaseFrom = vi.fn(() => ({ select: selectMock }));

      const res = await POST(
        makeRequest(BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(VALID_ACHIEVEMENT),
        })
      );
      expect(res.status).toBe(409);
      expect((await res.json()).error).toBe("Achievement key already exists");
    });

    test("returns 201 for valid creation", async () => {
      // First call: uniqueness check (select → eq → maybeSingle → null)
      // Second call: insert chain
      let callCount = 0;
      mockSupabaseFrom = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // Uniqueness check
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          };
        }
        // Insert chain
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: MOCK_ROW, error: null })),
            })),
          })),
        };
      });

      const res = await POST(
        makeRequest(BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(VALID_ACHIEVEMENT),
        })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.achievement.key).toBe("first_game");
      expect(body.achievement.xpValue).toBe(50);
    });
  });
});
