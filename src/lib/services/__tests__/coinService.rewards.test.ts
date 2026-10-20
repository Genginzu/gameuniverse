import { describe, it, expect, beforeEach, vi } from "vitest";

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: vi.fn(() => ({ rpc: mockRpc, from: mockFrom })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { CoinService } from "@/lib/services/coinService";

function walletChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve(result));
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CoinService.rewardActivity", () => {
  it("delegates caps and de-duplication to award_activity_reward", async () => {
    mockRpc.mockResolvedValue({ data: { rewarded: true, amount: 10 }, error: null });

    const result = await CoinService.rewardActivity("p1", "library_add", "game-1");

    expect(mockRpc).toHaveBeenCalledWith("award_activity_reward", {
      p_player_id: "p1",
      p_activity_type: "library_add",
      p_reference_id: "game-1",
    });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result).toEqual({ rewarded: true, amount: 10, reason: undefined });
  });

  it("reports a refused reward", async () => {
    mockRpc.mockResolvedValue({
      data: { rewarded: false, amount: 0, reason: "duplicate" },
      error: null,
    });

    await expect(CoinService.rewardActivity("p1", "friend_add", "friend-1")).resolves.toEqual({
      rewarded: false,
      amount: 0,
      reason: "duplicate",
    });
  });

  it("throws when the RPC fails", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    await expect(CoinService.rewardActivity("p1", "review")).rejects.toThrow(
      "Failed to award activity reward"
    );
  });
});

describe("CoinService.getWallet", () => {
  it("creates a missing wallet through ensure_player_wallet, never a direct bonus insert", async () => {
    const missing = walletChain({ data: null, error: { code: "PGRST116" } });
    const created = walletChain({
      data: { player_id: "p1", balance: 500, total_earned: 500, total_spent: 0 },
      error: null,
    });
    mockFrom.mockReturnValueOnce(missing).mockReturnValueOnce(created);
    mockRpc.mockResolvedValue({ data: null, error: null });

    const wallet = await CoinService.getWallet("p1");

    expect(mockRpc).toHaveBeenCalledWith("ensure_player_wallet", {
      p_player_id: "p1",
      p_signup_bonus: 500,
    });
    expect(wallet.balance).toBe(500);
  });

  it("does not grant a bonus on a read error other than 'no row'", async () => {
    mockFrom.mockReturnValueOnce(walletChain({ data: null, error: { code: "57014" } }));

    await expect(CoinService.getWallet("p1")).rejects.toThrow("Failed to fetch wallet");
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
