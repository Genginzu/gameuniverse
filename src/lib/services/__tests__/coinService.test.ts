import { describe, it, expect, beforeEach, vi } from "vitest";

const mockRpc = vi.fn();
const mockFrom = vi.fn();

// coinService uses the service-role client exclusively (issue #372).
vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: vi.fn(() => ({ rpc: mockRpc, from: mockFrom })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { CoinService } from "@/lib/services/coinService";

const GRANT = {
  adminId: "admin-1",
  playerId: "p1",
  amount: 100,
  description: "gift",
  nonce: "7f0c1d2e-3a4b-4c5d-8e9f-001122334455",
};

const entryRow = {
  id: "tx-3",
  player_id: "p1",
  amount: 100,
  type: "admin_grant",
  activity_type: null,
  reference_id: null,
  description: "[Admin admin-1] gift",
  balance_after: 600,
  created_at: "2026-10-23T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CoinService.grant", () => {
  it("posts one ledger entry keyed by the admin nonce", async () => {
    mockRpc.mockResolvedValue({ data: { posted: true, transaction: entryRow }, error: null });

    await CoinService.grant(GRANT);

    expect(mockRpc).toHaveBeenCalledWith("post_coin_entry", {
      p_player_id: "p1",
      p_amount: 100,
      p_type: "admin_grant",
      p_ledger_key: "admin_grant:7f0c1d2e-3a4b-4c5d-8e9f-001122334455",
      p_description: "[Admin admin-1] gift",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("maps the posted ledger entry", async () => {
    mockRpc.mockResolvedValue({ data: { posted: true, transaction: entryRow }, error: null });

    await expect(CoinService.grant(GRANT)).resolves.toEqual({
      posted: true,
      transaction: {
        id: "tx-3",
        playerId: "p1",
        amount: 100,
        type: "admin_grant",
        activityType: null,
        referenceId: null,
        description: "[Admin admin-1] gift",
        balanceAfter: 600,
        createdAt: "2026-10-23T00:00:00Z",
      },
    });
  });

  it.each(["duplicate", "insufficient_balance"] as const)(
    "reports a %s refusal without throwing",
    async (reason) => {
      mockRpc.mockResolvedValue({ data: { posted: false, reason }, error: null });

      await expect(CoinService.grant({ ...GRANT, amount: -50 })).resolves.toEqual({
        posted: false,
        reason,
      });
    }
  );

  it("rejects a zero amount without touching the DB", async () => {
    await expect(CoinService.grant({ ...GRANT, amount: 0 })).rejects.toThrow(
      "Amount cannot be zero"
    );
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("throws when the ledger write fails", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    await expect(CoinService.grant(GRANT)).rejects.toThrow("Failed to post ledger entry");
  });
});
