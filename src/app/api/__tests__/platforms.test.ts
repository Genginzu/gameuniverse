/**
 * Tests for public platforms API route (GET).
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

let platformsResult: { data: unknown; error: unknown };
let countsResult: { data: unknown; error: unknown };
const inFilter = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          in: (...args: unknown[]) => {
            inFilter(...args);
            return Promise.resolve(platformsResult);
          },
        }),
      }),
      rpc: () => Promise.resolve(countsResult),
    }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { GET } = await import("@/app/api/platforms/route");

function makeRequest(url: string) {
  return new Request(url) as unknown as import("next/server").NextRequest;
}

describe("GET /api/platforms — public route", () => {
  beforeEach(() => {
    inFilter.mockClear();
    platformsResult = { data: [], error: null };
    countsResult = { data: [], error: null };
  });

  test("returns platforms with their SQL game count, sorted by name", async () => {
    platformsResult = {
      data: [
        {
          id: "p1",
          slug: "xbox",
          icon_url: null,
          platform_translations: [{ name: "Xbox", abbreviation: null, language_code: "fr" }],
        },
        {
          id: "p2",
          slug: "ps5",
          icon_url: "https://icon.png",
          platform_translations: [
            { name: "PlayStation 5", abbreviation: "PS5", language_code: "fr" },
          ],
        },
      ],
      error: null,
    };
    countsResult = {
      data: [
        { facet: "platform", ref_id: "p1", game_count: 2400 },
        { facet: "platform", ref_id: "p2", game_count: 1 },
      ],
      error: null,
    };

    const res = await GET(makeRequest("http://localhost/api/platforms?locale=fr"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.platforms).toHaveLength(2);
    expect(body.platforms[0]).toMatchObject({
      name: "PlayStation 5",
      gameCount: 1,
      abbreviation: "PS5",
    });
    expect(body.platforms[1]).toMatchObject({ name: "Xbox", gameCount: 2400 });
    expect(body.locale).toBe("fr");
    expect(inFilter).toHaveBeenCalledWith("platform_translations.language_code", ["fr", "en"]);
  });

  test("keeps platforms without a translation in the locale, using the English name", async () => {
    platformsResult = {
      data: [
        {
          id: "p1",
          slug: "pc",
          icon_url: null,
          platform_translations: [
            { name: "PC (Microsoft Windows)", abbreviation: "PC", language_code: "en" },
          ],
        },
        {
          id: "p2",
          slug: "e-reader",
          icon_url: null,
          platform_translations: [
            { name: "e-Reader", abbreviation: null, language_code: "en" },
            { name: "Lecteur e-Reader", abbreviation: null, language_code: "fr" },
          ],
        },
        { id: "p3", slug: "unnamed", icon_url: null, platform_translations: [] },
      ],
      error: null,
    };

    const res = await GET(makeRequest("http://localhost/api/platforms?locale=fr"));
    const body = await res.json();
    expect(body.platforms.map((p: { name: string }) => p.name)).toEqual([
      "Lecteur e-Reader",
      "PC (Microsoft Windows)",
      "unnamed",
    ]);
  });

  test("returns empty array when no platforms exist", async () => {
    const res = await GET(makeRequest("http://localhost/api/platforms"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.platforms).toEqual([]);
  });

  test("returns 500 when the platforms query fails", async () => {
    platformsResult = { data: null, error: { message: "DB error" } };

    const res = await GET(makeRequest("http://localhost/api/platforms?locale=en"));
    expect(res.status).toBe(500);
  });
});
