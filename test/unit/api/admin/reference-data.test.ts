import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

let mockRequireAdmin: ReturnType<typeof vi.fn>;

vi.mock("../../../../src/lib/auth-admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

vi.mock("../../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockGetAvailableCompanies = vi.fn(() => Promise.resolve([{ id: "c1", name: "Capcom" }]));
const mockGetAvailableGenres = vi.fn(() => Promise.resolve([{ id: "g1", name: "Action" }]));
const mockGetAvailableStores = vi.fn(() => Promise.resolve([]));
const mockGetAvailableRatings = vi.fn(() => Promise.resolve([]));
const mockGetAvailableContentDescriptors = vi.fn(() => Promise.resolve([]));
const mockGetGameStatistics = vi.fn(() => Promise.resolve({ totalGames: 42 }));
const mockGetAvailableSupportedLanguages = vi.fn(() => Promise.resolve([]));
const mockGetAvailableGamePlatforms = vi.fn(() => Promise.resolve([]));

vi.mock("../../../../src/lib/admin-utils", () => ({
  getAvailableCompanies: (...args: unknown[]) => mockGetAvailableCompanies(...args),
  getAvailableGenres: (...args: unknown[]) => mockGetAvailableGenres(...args),
  getAvailableStores: (...args: unknown[]) => mockGetAvailableStores(...args),
  getAvailableRatings: (...args: unknown[]) => mockGetAvailableRatings(...args),
  getAvailableContentDescriptors: (...args: unknown[]) =>
    mockGetAvailableContentDescriptors(...args),
  getGameStatistics: (...args: unknown[]) => mockGetGameStatistics(...args),
  getAvailableSupportedLanguages: (...args: unknown[]) =>
    mockGetAvailableSupportedLanguages(...args),
  getAvailableGamePlatforms: (...args: unknown[]) => mockGetAvailableGamePlatforms(...args),
}));

const { GET } = await import("../../../../src/app/api/admin/reference-data/route");

function makeRequest(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params);
  return new NextRequest(`http://localhost/api/admin/reference-data?${qs.toString()}`);
}

describe("GET /api/admin/reference-data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn(() => Promise.resolve(true));
  });

  test("returns 403 when not admin", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  test("returns reference data with all includes", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.data.companies).toBeDefined();
    expect(body.data.genres).toBeDefined();
    expect(body.data.languages).toBeDefined();
    expect(body.data.currencies).toBeDefined();
    expect(body.data.platforms).toBeDefined();
    expect(body.data.mediaTypes).toBeDefined();
  });

  test("returns only requested includes (e.g., include=companies)", async () => {
    const res = await GET(makeRequest({ include: "companies" }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.data.companies).toBeDefined();
    expect(body.data.genres).toBeUndefined();
    expect(body.data.statistics).toBeUndefined();
    expect(mockGetAvailableCompanies).toHaveBeenCalled();
    expect(mockGetAvailableGenres).not.toHaveBeenCalled();
  });

  test("always includes static data when requested via 'all'", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();

    // Static data always present with default "all" include
    expect(body.data.languages).toEqual([
      { code: "fr", name: "Français", nativeName: "Français", isDefault: true },
      { code: "en", name: "English", nativeName: "English", isDefault: false },
    ]);
    expect(body.data.currencies).toHaveLength(4);
    expect(Array.isArray(body.data.platforms)).toBe(true);
    expect(body.data.mediaTypes).toHaveProperty("artwork");
    expect(body.data.mediaTypes).toHaveProperty("video");
  });
});
