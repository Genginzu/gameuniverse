import { describe, test, expect, beforeEach, vi } from "vitest";

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

vi.mock("../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { GET } = await import("../../../src/app/api/roles/route");

function makeRequest(url: string) {
  return new Request(url) as unknown as import("next/server").NextRequest;
}

describe("GET /api/roles", () => {
  beforeEach(() => {
    mockSupabaseFrom = null;
  });

  test("returns roles with translations and character counts", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "character_roles") {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({
                data: [
                  {
                    id: "r1",
                    slug: "hero",
                    character_role_translations: [
                      { language_code: "en", name: "Hero" },
                      { language_code: "fr", name: "Héros" },
                    ],
                  },
                  {
                    id: "r2",
                    slug: "villain",
                    character_role_translations: [
                      { language_code: "en", name: "Villain" },
                      { language_code: "fr", name: "Méchant" },
                    ],
                  },
                ],
                error: null,
              })
            ),
          })),
        };
      }
      if (table === "character_character_roles") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() =>
              Promise.resolve({
                data: [{ role_id: "r1" }, { role_id: "r1" }, { role_id: "r2" }],
                error: null,
              })
            ),
          })),
        };
      }
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/roles?locale=en"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.roles).toHaveLength(2);
    expect(body.roles[0].name).toBe("Hero");
    expect(body.roles[0].characterCount).toBe(2);
    expect(body.roles[1].name).toBe("Villain");
    expect(body.roles[1].characterCount).toBe(1);
  });

  test("returns 500 on error", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "character_roles") {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: null, error: { message: "DB error" } })),
          })),
        };
      }
      return {};
    });

    const res = await GET(makeRequest("http://localhost/api/roles"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch roles");
  });
});
