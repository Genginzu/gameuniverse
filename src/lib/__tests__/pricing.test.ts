import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRpc } = vi.hoisted(() => ({ mockRpc: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc: mockRpc }),
}));

import { getGamePrices, getBestPrice, compareGamePrices } from "@/lib/pricing";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getGamePrices", () => {
  it("calls rpc with correct params", async () => {
    mockRpc.mockResolvedValue({ data: [{ price: 29.99 }], error: null });
    const result = await getGamePrices("game1", { store_filter: "steam" });
    expect(mockRpc).toHaveBeenCalledWith("get_game_prices", {
      game_uuid: "game1",
      store_filter: "steam",
      platform_filter: undefined,
    });
    expect(result).toEqual([{ price: 29.99 }]);
  });

  it("throws on error", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "DB error" } });
    await expect(getGamePrices("game1")).rejects.toThrow("Failed to get game prices");
  });
});

describe("getBestPrice", () => {
  it("returns first result", async () => {
    mockRpc.mockResolvedValue({ data: [{ price: 9.99, store: "steam" }], error: null });
    const result = await getBestPrice("game1");
    expect(result).toEqual({ price: 9.99, store: "steam" });
  });

  it("returns null when no data", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    const result = await getBestPrice("game1");
    expect(result).toBeNull();
  });
});

describe("compareGamePrices", () => {
  it("throws on error", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "fail" } });
    await expect(compareGamePrices("game1")).rejects.toThrow("Failed to compare game prices");
  });
});
