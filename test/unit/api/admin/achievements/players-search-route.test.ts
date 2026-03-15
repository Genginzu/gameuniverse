/**
 * Unit tests for GET /api/admin/achievements/players/search
 * Tests auth protection, empty query, username search, UUID search, and DB errors.
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

// Import after mocks
const { GET } =
  await import("../../../../../../src/app/api/admin/achievements/players/search/route");

const BASE_URL = "http://localhost/api/admin/achievements/players/search";

function makeRequest(url: string) {
  return new Request(url) as unknown as import("next/server").NextRequest;
}

describe("Admin Achievements — Player Search (GET /search)", () => {
  beforeEach(() => {
    mockRequireAdmin = vi.fn(() => Promise.resolve(true));
    mockSupabaseFrom = null;
  });

  test("returns 403 without admin auth", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });

    const res = await GET(makeRequest(BASE_URL));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Admin access required");
  });

  test("returns empty array for empty query", async () => {
    const res = await GET(makeRequest(BASE_URL));
    expect(res.status).toBe(200);
    expect((await res.json()).players).toEqual([]);
  });

  test("returns empty array for whitespace-only query", async () => {
    const res = await GET(makeRequest(`${BASE_URL}?q=%20%20`));
    expect(res.status).toBe(200);
    expect((await res.json()).players).toEqual([]);
  });

  test("returns matching players by username", async () => {
    const mockRow = { id: "u1", username: "testplayer", avatar_url: "https://img/1.png" };

    mockSupabaseFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        ilike: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [mockRow], error: null })),
        })),
      })),
    }));

    const res = await GET(makeRequest(`${BASE_URL}?q=test`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.players).toHaveLength(1);
    expect(body.players[0]).toEqual({
      id: "u1",
      username: "testplayer",
      avatarUrl: "https://img/1.png",
    });
  });

  test("returns player by exact UUID", async () => {
    const uuid = "11111111-2222-3333-4444-555555555555";
    const mockRow = { id: uuid, username: "uuidplayer", avatar_url: null };

    mockSupabaseFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [mockRow], error: null })),
        })),
      })),
    }));

    const res = await GET(makeRequest(`${BASE_URL}?q=${uuid}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.players).toHaveLength(1);
    expect(body.players[0]).toEqual({
      id: uuid,
      username: "uuidplayer",
      avatarUrl: null,
    });
  });

  test("handles DB error with 500", async () => {
    mockSupabaseFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        ilike: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: null, error: { message: "DB failure" } })),
        })),
      })),
    }));

    const res = await GET(makeRequest(`${BASE_URL}?q=broken`));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Internal server error");
  });
});
