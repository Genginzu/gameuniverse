import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CoinService } from "@/lib/services/coinService";

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {};

  const makeChain = (terminal?: Record<string, unknown>) => {
    const c = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      ...terminal,
    };
    // Make each method return the chain
    for (const key of ["select", "insert", "update", "eq", "gte", "order"]) {
      (c as Record<string, unknown>)[key] = vi.fn().mockReturnValue(c);
    }
    return c;
  };

  const defaultChain = makeChain(overrides);
  Object.assign(chain, defaultChain);

  return {
    from: vi.fn().mockReturnValue(chain),
    rpc: vi.fn().mockResolvedValue({ data: true }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
    _chain: chain,
  };
}

describe("CoinService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWallet", () => {
    it("returns existing wallet", async () => {
      const mock = createMockSupabase({
        single: vi.fn().mockResolvedValue({
          data: { player_id: "user-1", balance: 500, total_earned: 500, total_spent: 0 },
          error: null,
        }),
      });
      vi.mocked(createRouteHandlerClient).mockResolvedValue(mock as never);

      const wallet = await CoinService.getWallet("user-1");
      expect(wallet.balance).toBe(500);
      expect(wallet.playerId).toBe("user-1");
    });
  });

  describe("creditCoins", () => {
    it("throws if amount is not positive", async () => {
      await expect(CoinService.creditCoins("user-1", 0, "activity_reward")).rejects.toThrow(
        "Credit amount must be positive"
      );
      await expect(CoinService.creditCoins("user-1", -10, "activity_reward")).rejects.toThrow(
        "Credit amount must be positive"
      );
    });

    it("inserts a positive transaction", async () => {
      const singleFn = vi
        .fn()
        // First call: get current balance
        .mockResolvedValueOnce({ data: { balance: 100 }, error: null })
        // Second call: insert transaction
        .mockResolvedValueOnce({
          data: {
            id: "tx-1",
            player_id: "user-1",
            amount: 50,
            type: "activity_reward",
            activity_type: "review",
            reference_id: null,
            description: null,
            balance_after: 150,
            created_at: new Date().toISOString(),
          },
          error: null,
        });

      const mock = createMockSupabase({ single: singleFn });
      vi.mocked(createRouteHandlerClient).mockResolvedValue(mock as never);

      const tx = await CoinService.creditCoins("user-1", 50, "activity_reward", "review");
      expect(tx.amount).toBe(50);
      expect(tx.balanceAfter).toBe(150);
    });
  });

  describe("debitCoins", () => {
    it("throws if amount is not positive", async () => {
      await expect(CoinService.debitCoins("user-1", 0, "prediction_bet")).rejects.toThrow(
        "Debit amount must be positive"
      );
    });

    it("throws if insufficient balance", async () => {
      const mock = createMockSupabase({
        single: vi.fn().mockResolvedValue({
          data: { player_id: "user-1", balance: 10, total_earned: 10, total_spent: 0 },
          error: null,
        }),
      });
      vi.mocked(createRouteHandlerClient).mockResolvedValue(mock as never);

      await expect(CoinService.debitCoins("user-1", 100, "prediction_bet")).rejects.toThrow(
        "Insufficient balance"
      );
    });
  });

  describe("rewardActivity", () => {
    it("returns not rewarded when config is disabled", async () => {
      const mock = createMockSupabase({
        single: vi.fn().mockResolvedValue({
          data: {
            activity_type: "review",
            amount: 50,
            cooldown_seconds: null,
            daily_cap: 5,
            enabled: false,
          },
          error: null,
        }),
      });
      vi.mocked(createRouteHandlerClient).mockResolvedValue(mock as never);

      const result = await CoinService.rewardActivity("user-1", "review");
      expect(result.rewarded).toBe(false);
      expect(result.reason).toBe("disabled");
    });
  });

  describe("getTransactionHistory", () => {
    it("returns paginated transactions", async () => {
      const txData = [
        {
          id: "tx-1",
          player_id: "user-1",
          amount: 50,
          type: "activity_reward",
          activity_type: "review",
          reference_id: null,
          description: null,
          balance_after: 550,
          created_at: new Date().toISOString(),
        },
      ];

      const mock = createMockSupabase({
        range: vi.fn().mockResolvedValue({ data: txData, count: 1, error: null }),
      });
      vi.mocked(createRouteHandlerClient).mockResolvedValue(mock as never);

      const result = await CoinService.getTransactionHistory("user-1", 1, 20);
      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe("grantCoins", () => {
    it("throws if amount is zero", async () => {
      await expect(CoinService.grantCoins("admin-1", "user-1", 0, "test")).rejects.toThrow(
        "Amount cannot be zero"
      );
    });
  });
});
