/**
 * Unit tests for GET/PUT/DELETE /api/admin/achievements/[id]
 * Tests auth, not found, validation, duplicate key, update, and deletion.
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockSupabaseFrom: ReturnType<typeof vi.fn> | null;

vi.mock("@/lib/auth-admin", () => ({
  requireAdmin: () => (mockRequireAdmin ? mockRequireAdmin() : Promise.resolve(true)),
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => (mockSupabaseFrom ? mockSupabaseFrom(table) : {}),
    }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const {
  GET,
  PUT,
  DELETE: DEL,
} = await import("../../../../../src/app/api/admin/achievements/[id]/route");

const URL = "http://localhost/api/admin/achievements";
const ID = "11111111-2222-3333-4444-555555555555";

function req(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}
function ctx(id = ID) {
  return { params: Promise.resolve({ id }) };
}
function putReq(body: object) {
  return req(`${URL}/${ID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const BODY = {
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
const ROW = {
  id: ID,
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

/** Helper: mock a select→eq→maybeSingle chain returning `data` */
function mockSelectEqMaybe(data: unknown) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(() => Promise.resolve({ data, error: null })),
      })),
    })),
  };
}

/** Helper: mock a select→eq→neq→maybeSingle chain returning `data` */
function mockSelectEqNeqMaybe(data: unknown) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        neq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data, error: null })),
        })),
      })),
    })),
  };
}

function denyAdmin() {
  mockRequireAdmin = vi.fn(() => {
    throw new Error("Admin access required");
  });
}

describe("Admin Achievements API — GET/PUT/DELETE [id]", () => {
  beforeEach(() => {
    mockRequireAdmin = vi.fn(() => Promise.resolve(true));
    mockSupabaseFrom = null;
  });

  describe("GET [id]", () => {
    test("returns 403 when not admin", async () => {
      denyAdmin();
      const res = await GET(req(`${URL}/${ID}`), ctx());
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe("Admin access required");
    });

    test("returns 404 when not found", async () => {
      mockSupabaseFrom = vi.fn(() => mockSelectEqMaybe(null));
      const res = await GET(req(`${URL}/${ID}`), ctx());
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe("Achievement not found");
    });

    test("returns achievement by ID", async () => {
      mockSupabaseFrom = vi.fn(() => mockSelectEqMaybe(ROW));
      const res = await GET(req(`${URL}/${ID}`), ctx());
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.achievement.key).toBe("first_game");
      expect(body.achievement.xpValue).toBe(50);
    });
  });

  describe("PUT [id]", () => {
    test("returns 403 when not admin", async () => {
      denyAdmin();
      const res = await PUT(putReq(BODY), ctx());
      expect(res.status).toBe(403);
    });

    test("returns 400 for invalid data", async () => {
      const res = await PUT(putReq({ ...BODY, key: "" }), ctx());
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Invalid input data");
    });

    test("returns 404 when not found", async () => {
      mockSupabaseFrom = vi.fn(() => mockSelectEqMaybe(null));
      const res = await PUT(putReq(BODY), ctx());
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe("Achievement not found");
    });

    test("returns 409 for duplicate key", async () => {
      let n = 0;
      mockSupabaseFrom = vi.fn(() =>
        ++n === 1 ? mockSelectEqMaybe({ id: ID }) : mockSelectEqNeqMaybe({ id: "other-id" })
      );
      const res = await PUT(putReq(BODY), ctx());
      expect(res.status).toBe(409);
      expect((await res.json()).error).toBe("Achievement key already exists");
    });

    test("returns 200 for valid update", async () => {
      let n = 0;
      mockSupabaseFrom = vi.fn(() => {
        n++;
        if (n === 1) return mockSelectEqMaybe({ id: ID });
        if (n === 2) return mockSelectEqNeqMaybe(null);
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: ROW, error: null })),
              })),
            })),
          })),
        };
      });
      const res = await PUT(putReq(BODY), ctx());
      expect(res.status).toBe(200);
      expect((await res.json()).achievement.key).toBe("first_game");
    });
  });

  describe("DELETE [id]", () => {
    test("returns 403 when not admin", async () => {
      denyAdmin();
      const res = await DEL(req(`${URL}/${ID}`, { method: "DELETE" }), ctx());
      expect(res.status).toBe(403);
    });

    test("returns 404 when not found", async () => {
      mockSupabaseFrom = vi.fn(() => mockSelectEqMaybe(null));
      const res = await DEL(req(`${URL}/${ID}`, { method: "DELETE" }), ctx());
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe("Achievement not found");
    });

    test("returns 409 when in use without force", async () => {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "achievement_catalog")
          return mockSelectEqMaybe({ id: ID, key: "first_game" });
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ count: 5, error: null })),
          })),
        };
      });
      const res = await DEL(req(`${URL}/${ID}`, { method: "DELETE" }), ctx());
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe("Achievement in use");
      expect(body.usageCount).toBe(5);
    });

    test("returns 200 with force=true even when in use", async () => {
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "achievement_catalog")
          return {
            ...mockSelectEqMaybe({ id: ID, key: "first_game" }),
            delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
          };
        return {};
      });
      const res = await DEL(req(`${URL}/${ID}?force=true`, { method: "DELETE" }), ctx());
      expect(res.status).toBe(200);
      expect((await res.json()).success).toBe(true);
    });

    test("returns 200 when no usage", async () => {
      let n = 0;
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "achievement_catalog") {
          n++;
          if (n === 1) return mockSelectEqMaybe({ id: ID, key: "first_game" });
          return { delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })) };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ count: 0, error: null })),
          })),
        };
      });
      const res = await DEL(req(`${URL}/${ID}`, { method: "DELETE" }), ctx());
      expect(res.status).toBe(200);
      expect((await res.json()).success).toBe(true);
    });
  });
});
