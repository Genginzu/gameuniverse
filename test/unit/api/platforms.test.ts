/**
 * Tests for public platforms API route (GET).
 * Requirements: 8.1, 8.2
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

// --- Mock setup ---
let mockSupabaseFrom: any;

vi.mock("../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (mockSupabaseFrom) return mockSupabaseFrom(table);
        return {};
      },
    }),
}));

const { GET } = await import("../../../src/app/api/platforms/route");

function makeRequest(url: string) {
  return new Request(url) as unknown as import("next/server").NextRequest;
}

describe("GET /api/platforms — public route", () => {
  beforeEach(() => {
    mockSupabaseFrom = null;
  });

  test("returns platforms with game count sorted by name", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "platforms") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                data: [
                  {
                    id: "p1",
                    slug: "xbox",
                    icon_url: null,
                    created_at: "2024-01-01",
                    platform_translations: [{ name: "Xbox", abbreviation: null }],
                  },
                  {
                    id: "p2",
                    slug: "ps5",
                    icon_url: "https://icon.png",
                    created_at: "2024-01-01",
                    platform_translations: [{ name: "PlayStation 5", abbreviation: "PS5" }],
                  },
                ],
                error: null,
              })
            ),
          })),
        };
      }
      if (table === "game_platforms") {
        return {
          select: vi.fn(() =>
            Promise.resolve({
              data: [{ platform_id: "p1" }, { platform_id: "p1" }, { platform_id: "p2" }],
              error: null,
            })
          ),
        };
      }
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/platforms?locale=fr"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.platforms).toHaveLength(2);
    // Sorted by name: PlayStation 5 < Xbox
    expect(body.platforms[0].name).toBe("PlayStation 5");
    expect(body.platforms[0].gameCount).toBe(1);
    expect(body.platforms[0].abbreviation).toBe("PS5");
    expect(body.platforms[1].name).toBe("Xbox");
    expect(body.platforms[1].gameCount).toBe(2);
    expect(body.locale).toBe("fr");
  });

  test("returns empty array when no platforms exist", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "platforms") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      }
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/platforms"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.platforms).toEqual([]);
  });

  test("returns 500 when database query fails for locale=en", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "platforms") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: { message: "DB error" } })),
          })),
        };
      }
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/platforms?locale=en"));
    expect(res.status).toBe(500);
  });

  test("falls back to English when locale translation fails", async () => {
    let callCount = 0;
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "platforms") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => {
              callCount++;
              if (callCount === 1) {
                // First call (fr) fails
                return Promise.resolve({
                  data: null,
                  error: { message: "No FR translations" },
                });
              }
              // Second call (en fallback) succeeds
              return Promise.resolve({
                data: [
                  {
                    id: "p1",
                    slug: "pc",
                    icon_url: null,
                    created_at: "2024-01-01",
                    platform_translations: [{ name: "PC", abbreviation: null }],
                  },
                ],
                error: null,
              });
            }),
          })),
        };
      }
      if (table === "game_platforms") {
        return {
          select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        };
      }
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/platforms?locale=fr"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.platforms).toHaveLength(1);
    expect(body.platforms[0].name).toBe("PC");
  });
});
