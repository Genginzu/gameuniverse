import { describe, it, expect, vi, beforeEach } from "vitest";

const mockOrder = vi.fn();
const mockEq = vi.fn(() => ({ order: mockOrder }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { getAvailableCompanies, getAvailableGenres } from "@/lib/admin-utils";

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ order: mockOrder });
});

describe("getAvailableCompanies", () => {
  it("returns companies array", async () => {
    mockOrder.mockResolvedValue({ data: [{ id: "1", name: "Studio" }], error: null });
    const result = await getAvailableCompanies();
    expect(result).toEqual([{ id: "1", name: "Studio" }]);
    expect(mockFrom).toHaveBeenCalledWith("companies");
  });

  it("returns empty array on error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: "fail" } });
    const result = await getAvailableCompanies();
    expect(result).toEqual([]);
  });
});

describe("getAvailableGenres", () => {
  it("returns genres with translated names", async () => {
    mockSelect.mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: [{ id: "1", slug: "rpg", genre_translations: [{ name: "RPG", description: null, language_code: "fr" }] }],
        error: null,
      }),
    });
    const result = await getAvailableGenres("fr");
    expect(result[0].name).toBe("RPG");
  });

  it("returns empty on error", async () => {
    mockSelect.mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: null, error: { message: "fail" } }),
    });
    const result = await getAvailableGenres();
    expect(result).toEqual([]);
  });
});
