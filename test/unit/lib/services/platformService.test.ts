import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PlatformService } from "@/lib/services/platformService";

/**
 * Unit tests for PlatformService.
 * Tests fetchPlatforms, fetchPlatformsByLocale, fetchPlatformBySlug, and edge cases.
 * Requirements: 2.1, 2.2, 8.1, 8.2
 */

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("PlatformService.fetchPlatforms", () => {
  it("returns paginated platforms list", async () => {
    const mockResponse = {
      platforms: [{ id: "1", slug: "ps5", iconUrl: null, gameCount: 10, translations: [] }],
      total: 1,
      page: 1,
      limit: 20,
    };

    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200 }))
    ) as typeof fetch;

    const result = await PlatformService.fetchPlatforms({ page: 1, limit: 20 });

    expect(result.platforms).toHaveLength(1);
    expect(result.platforms[0].slug).toBe("ps5");
    expect(result.total).toBe(1);
  });

  it("passes search and sort params to URL", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ platforms: [], total: 0, page: 1, limit: 20 }), {
          status: 200,
        })
      )
    ) as typeof fetch;

    await PlatformService.fetchPlatforms({
      search: "play",
      sortBy: "name",
      sortOrder: "desc",
      locale: "en",
    });

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain("search=play");
    expect(calledUrl).toContain("sort_by=name");
    expect(calledUrl).toContain("sort_order=desc");
    expect(calledUrl).toContain("locale=en");
  });

  it("throws on non-OK response", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 500, statusText: "Internal Server Error" }))
    ) as typeof fetch;

    await expect(PlatformService.fetchPlatforms()).rejects.toThrow("Failed to fetch platforms");
  });
});

describe("PlatformService.fetchPlatformsByLocale", () => {
  it("returns platforms for given locale", async () => {
    const mockPlatforms = [
      { id: "1", slug: "ps5", name: "PlayStation 5", gameCount: 5 },
      { id: "2", slug: "xbox-series-x", name: "Xbox Series X", gameCount: 3 },
    ];

    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ platforms: mockPlatforms }), { status: 200 }))
    ) as typeof fetch;

    const result = await PlatformService.fetchPlatformsByLocale("fr");

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("PlayStation 5");
  });

  it("returns empty array when no platforms exist", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ platforms: [] }), { status: 200 }))
    ) as typeof fetch;

    const result = await PlatformService.fetchPlatformsByLocale("fr");
    expect(result).toEqual([]);
  });

  it("defaults to fr locale", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ platforms: [] }), { status: 200 }))
    ) as typeof fetch;

    await PlatformService.fetchPlatformsByLocale();

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain("locale=fr");
  });

  it("throws on non-OK response", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 503, statusText: "Service Unavailable" }))
    ) as typeof fetch;

    await expect(PlatformService.fetchPlatformsByLocale("en")).rejects.toThrow(
      "Failed to fetch platforms"
    );
  });
});

describe("PlatformService.fetchPlatformBySlug", () => {
  it("returns platform detail for valid slug", async () => {
    const mockPlatform = {
      id: "1",
      slug: "ps5",
      iconUrl: null,
      gameCount: 10,
      translations: [{ language_code: "en", name: "PlayStation 5" }],
    };

    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(mockPlatform), { status: 200 }))
    ) as typeof fetch;

    const result = await PlatformService.fetchPlatformBySlug("ps5", "en");

    expect(result).not.toBeNull();
    expect(result!.slug).toBe("ps5");
  });

  it("returns null for 404", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 404 }))
    ) as typeof fetch;

    const result = await PlatformService.fetchPlatformBySlug("nonexistent");
    expect(result).toBeNull();
  });

  it("throws on other errors", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 500, statusText: "Internal Server Error" }))
    ) as typeof fetch;

    await expect(PlatformService.fetchPlatformBySlug("ps5")).rejects.toThrow(
      "Failed to fetch platform"
    );
  });

  it("defaults to fr locale", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
    ) as typeof fetch;

    await PlatformService.fetchPlatformBySlug("ps5");

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain("locale=fr");
  });
});
