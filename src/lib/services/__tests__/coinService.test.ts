import { describe, it, expect, beforeEach, vi } from "vitest";

// --- Mock setup ---

const mockFrom = vi.fn();
const mockSupabaseClient = { from: mockFrom };

// coinService now uses the service-role client exclusively (issue #372).
vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: vi.fn(() => mockSupabaseClient),
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { CoinService } from "@/lib/services/coinService";

// --- Chainable mock helper ---

function buildChain(result: { data?: unknown; count?: number | null; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const resolver = () => Promise.resolve(result);
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.range = vi.fn(resolver);
  chain.single = vi.fn(resolver);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.then = vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve));
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CoinService.creditCoins", () => {
  it("inserts a positive transaction with the service-role client", async () => {
    const walletChain = buildChain({ data: { balance: 100 }, error: null });
    const txRow = {
      id: "tx-1",
      player_id: "p1",
      amount: 50,
      type: "activity_reward",
      activity_type: "review",
      reference_id: null,
      description: null,
      balance_after: 150,
      created_at: "2026-10-18T00:00:00Z",
    };
    const insertChain = buildChain({ data: txRow, error: null });

    mockFrom.mockImplementation((table: string) =>
      table === "player_wallets" ? walletChain : insertChain
    );

    const result = await CoinService.creditCoins("p1", 50, "activity_reward", "review");

    expect(result.amount).toBe(50);
    expect(result.balanceAfter).toBe(150);
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ player_id: "p1", amount: 50, balance_after: 150 })
    );
  });

  it("rejects a non-positive credit without touching the DB", async () => {
    await expect(CoinService.creditCoins("p1", 0, "admin_grant")).rejects.toThrow(
      "Credit amount must be positive"
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe("CoinService.debitCoins", () => {
  it("throws when the balance is insufficient", async () => {
    const walletChain = buildChain({ data: { balance: 10 }, error: null });
    mockFrom.mockImplementation(() => walletChain);

    await expect(
      CoinService.debitCoins("p1", 50, "prediction_bet")
    ).rejects.toThrow("Insufficient balance");
  });

  it("inserts a negative transaction when the balance covers it", async () => {
    const walletChain = buildChain({ data: { balance: 200 }, error: null });
    const txRow = {
      id: "tx-2",
      player_id: "p1",
      amount: -50,
      type: "prediction_bet",
      activity_type: null,
      reference_id: null,
      description: "bet",
      balance_after: 150,
      created_at: "2026-10-18T00:00:00Z",
    };
    const insertChain = buildChain({ data: txRow, error: null });
    mockFrom.mockImplementation((table: string) =>
      table === "player_wallets" ? walletChain : insertChain
    );

    const result = await CoinService.debitCoins("p1", 50, "prediction_bet", undefined, "bet");

    expect(result.amount).toBe(-50);
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ amount: -50, type: "prediction_bet" })
    );
  });
});

describe("CoinService.grantCoins", () => {
  it("prefixes the description with the admin id for a positive grant", async () => {
    const walletChain = buildChain({ data: { balance: 0 }, error: null });
    const insertChain = buildChain({
      data: {
        id: "tx-3",
        player_id: "p1",
        amount: 100,
        type: "admin_grant",
        activity_type: null,
        reference_id: null,
        description: "[Admin admin-1] gift",
        balance_after: 100,
        created_at: "2026-10-18T00:00:00Z",
      },
      error: null,
    });
    mockFrom.mockImplementation((table: string) =>
      table === "player_wallets" ? walletChain : insertChain
    );

    const result = await CoinService.grantCoins("admin-1", "p1", 100, "gift");

    expect(result.description).toBe("[Admin admin-1] gift");
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ description: "[Admin admin-1] gift", type: "admin_grant" })
    );
  });

  it("rejects a zero amount", async () => {
    await expect(CoinService.grantCoins("admin-1", "p1", 0, "x")).rejects.toThrow(
      "Amount cannot be zero"
    );
  });
});
