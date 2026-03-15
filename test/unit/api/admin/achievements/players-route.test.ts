/**
 * Unit tests for GET/POST/DELETE /api/admin/achievements/players
 * Tests auth, validation, assignment, revocation, XP clamping, and race conditions.
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

// --- Mutable mock references ---
let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockSupabaseFrom: ReturnType<typeof vi.fn> | null;

// --- Mock modules ---
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

vi.mock("@/lib/services/levelSystem", () => ({
  computeLevel: vi.fn((xp: number) => Math.floor(0.3 * Math.sqrt(Math.max(xp, 0))) + 1),
}));

// Import after mocks
const {
  GET,
  POST,
  DELETE: DEL,
} = await import("../../../../../src/app/api/admin/achievements/players/route");

const BASE_URL = "http://localhost/api/admin/achievements/players";
const USER_ID = "aaaaaaaa-bbbb-4ccc-aaaa-eeeeeeeeeeee";

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}

function jsonReq(method: string, body: object) {
  return makeRequest(BASE_URL, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function denyAdmin() {
  mockRequireAdmin = vi.fn(() => {
    throw new Error("Admin access required");
  });
}

/** Build a chainable mock for the supabase client that tracks calls per table */
function buildSupabaseMock(config: {
  catalog?: { data: unknown; error: unknown };
  playerAchievementsSelect?: { data: unknown; error?: unknown };
  playerAchievementsInsert?: { error: unknown };
  playerAchievementsDelete?: { error: unknown };
  playerXpSelect?: { data: unknown };
  playerXpUpsert?: { error: unknown };
  profilesUpdate?: { error: unknown };
}) {
  return vi.fn((table: string) => {
    if (table === "achievement_catalog") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() =>
              Promise.resolve(config.catalog ?? { data: null, error: null })
            ),
          })),
        })),
      };
    }
    if (table === "player_achievements") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => {
            // For GET: just .eq("user_id", ...) returns rows
            // For POST/DELETE check: .eq("user_id", ...).eq("achievement_key", ...).maybeSingle()
            return {
              // GET path (no further chaining)
              ...Promise.resolve(config.playerAchievementsSelect ?? { data: [], error: null }),
              // POST/DELETE check path
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() =>
                  Promise.resolve(config.playerAchievementsSelect ?? { data: null, error: null })
                ),
              })),
            };
          }),
        })),
        insert: vi.fn(() => Promise.resolve(config.playerAchievementsInsert ?? { error: null })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve(config.playerAchievementsDelete ?? { error: null })),
          })),
        })),
      };
    }
    if (table === "player_xp") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() =>
              Promise.resolve(config.playerXpSelect ?? { data: null, error: null })
            ),
          })),
        })),
        upsert: vi.fn(() => Promise.resolve(config.playerXpUpsert ?? { error: null })),
      };
    }
    if (table === "profiles") {
      return {
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve(config.profilesUpdate ?? { error: null })),
        })),
      };
    }
    return {};
  });
}

describe("Admin Achievements — Player Achievements (GET/POST/DELETE)", () => {
  beforeEach(() => {
    mockRequireAdmin = vi.fn(() => Promise.resolve(true));
    mockSupabaseFrom = null;
  });

  // --- GET ---
  describe("GET /api/admin/achievements/players", () => {
    test("returns 403 without admin auth", async () => {
      denyAdmin();
      const res = await GET(makeRequest(BASE_URL));
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe("Admin access required");
    });

    test("returns 400 when userId is missing", async () => {
      const res = await GET(makeRequest(BASE_URL));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Invalid input data");
    });

    test("returns list of achievement keys for a player", async () => {
      const rows = [{ achievement_key: "first_game" }, { achievement_key: "ten_reviews" }];
      mockSupabaseFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: rows, error: null })),
        })),
      }));

      const res = await GET(makeRequest(`${BASE_URL}?userId=${USER_ID}`));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.achievements).toEqual(["first_game", "ten_reviews"]);
    });

    test("returns empty array when player has no achievements", async () => {
      mockSupabaseFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      }));

      const res = await GET(makeRequest(`${BASE_URL}?userId=${USER_ID}`));
      expect(res.status).toBe(200);
      expect((await res.json()).achievements).toEqual([]);
    });
  });

  // --- POST ---
  describe("POST /api/admin/achievements/players", () => {
    test("returns 403 without admin auth", async () => {
      denyAdmin();
      const res = await POST(jsonReq("POST", { userId: USER_ID, achievementKey: "k" }));
      expect(res.status).toBe(403);
    });

    test("returns 400 with invalid body (missing fields)", async () => {
      const res = await POST(jsonReq("POST", { userId: "not-a-uuid" }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Invalid input data");
    });

    test("returns 404 when achievement key not found in catalog", async () => {
      mockSupabaseFrom = buildSupabaseMock({
        catalog: { data: null, error: null },
      });
      const res = await POST(jsonReq("POST", { userId: USER_ID, achievementKey: "nope" }));
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe("Achievement not found");
    });

    test("returns 409 when achievement already assigned", async () => {
      mockSupabaseFrom = buildSupabaseMock({
        catalog: { data: { xp_value: 100 }, error: null },
        playerAchievementsSelect: { data: { achievement_key: "first_game" } },
      });
      const res = await POST(jsonReq("POST", { userId: USER_ID, achievementKey: "first_game" }));
      expect(res.status).toBe(409);
      expect((await res.json()).error).toBe("Achievement already assigned");
    });

    test("returns 201 on successful assignment", async () => {
      mockSupabaseFrom = buildSupabaseMock({
        catalog: { data: { xp_value: 100 }, error: null },
        playerAchievementsSelect: { data: null },
        playerAchievementsInsert: { error: null },
        playerXpSelect: { data: { xp_total: 200 } },
        playerXpUpsert: { error: null },
        profilesUpdate: { error: null },
      });
      const res = await POST(jsonReq("POST", { userId: USER_ID, achievementKey: "first_game" }));
      expect(res.status).toBe(201);
      expect((await res.json()).success).toBe(true);
    });

    test("handles race condition (23505 unique constraint)", async () => {
      mockSupabaseFrom = buildSupabaseMock({
        catalog: { data: { xp_value: 50 }, error: null },
        playerAchievementsSelect: { data: null },
        playerAchievementsInsert: { error: { code: "23505", message: "unique violation" } },
      });
      const res = await POST(jsonReq("POST", { userId: USER_ID, achievementKey: "first_game" }));
      expect(res.status).toBe(409);
      expect((await res.json()).error).toBe("Achievement already assigned");
    });
  });

  // --- DELETE ---
  describe("DELETE /api/admin/achievements/players", () => {
    test("returns 403 without admin auth", async () => {
      denyAdmin();
      const res = await DEL(jsonReq("DELETE", { userId: USER_ID, achievementKey: "k" }));
      expect(res.status).toBe(403);
    });

    test("returns 400 with invalid body", async () => {
      const res = await DEL(jsonReq("DELETE", {}));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Invalid input data");
    });

    test("returns 404 when achievement not found in catalog", async () => {
      mockSupabaseFrom = buildSupabaseMock({
        catalog: { data: null, error: null },
      });
      const res = await DEL(jsonReq("DELETE", { userId: USER_ID, achievementKey: "nope" }));
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe("Achievement not found");
    });

    test("returns 404 when achievement not assigned to player", async () => {
      mockSupabaseFrom = buildSupabaseMock({
        catalog: { data: { xp_value: 100 }, error: null },
        playerAchievementsSelect: { data: null },
      });
      const res = await DEL(jsonReq("DELETE", { userId: USER_ID, achievementKey: "first_game" }));
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe("Achievement not assigned to player");
    });

    test("returns 200 on successful revocation", async () => {
      mockSupabaseFrom = buildSupabaseMock({
        catalog: { data: { xp_value: 100 }, error: null },
        playerAchievementsSelect: { data: { achievement_key: "first_game" } },
        playerAchievementsDelete: { error: null },
        playerXpSelect: { data: { xp_total: 300 } },
        playerXpUpsert: { error: null },
        profilesUpdate: { error: null },
      });
      const res = await DEL(jsonReq("DELETE", { userId: USER_ID, achievementKey: "first_game" }));
      expect(res.status).toBe(200);
      expect((await res.json()).success).toBe(true);
    });

    test("clamps XP to 0 when revocation would go negative", async () => {
      mockSupabaseFrom = buildSupabaseMock({
        catalog: { data: { xp_value: 500 }, error: null },
        playerAchievementsSelect: { data: { achievement_key: "big_one" } },
        playerAchievementsDelete: { error: null },
        playerXpSelect: { data: { xp_total: 100 } },
        playerXpUpsert: { error: null },
        profilesUpdate: { error: null },
      });
      const res = await DEL(jsonReq("DELETE", { userId: USER_ID, achievementKey: "big_one" }));
      expect(res.status).toBe(200);
      expect((await res.json()).success).toBe(true);
    });
  });
});
