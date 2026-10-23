import { describe, it, expect, beforeEach, vi } from "vitest";

// --- Mock setup ---

const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockAdminClient = { rpc: mockRpc, from: mockFrom };
const mockRouteClient = { from: mockFrom };

// placePrediction + settlement use the service-role client (issue #372).
vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: vi.fn(() => mockAdminClient),
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => mockRouteClient),
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { placePrediction, resolvePredictionsForMatch } from "@/lib/services/esportPredictionService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("placePrediction", () => {
  it("calls the atomic RPC via the service-role client", async () => {
    const row = {
      id: "pred-1",
      player_id: "p1",
      match_id: 42,
      match_name: "A vs B",
      game: "lol",
      predicted_winner_id: 7,
      predicted_winner_name: "Team A",
      amount: 100,
      status: "pending",
      payout: 0,
      created_at: "2026-10-18T00:00:00Z",
    };
    mockRpc.mockResolvedValue({ data: row, error: null });

    const result = await placePrediction(
      "p1",
      { matchId: 42, matchName: "A vs B", game: "lol", winnerId: 7, winnerName: "Team A" },
      100
    );

    expect(mockRpc).toHaveBeenCalledWith("place_esport_prediction", {
      p_player_id: "p1",
      p_match_id: 42,
      p_match_name: "A vs B",
      p_game: "lol",
      p_predicted_winner_id: 7,
      p_predicted_winner_name: "Team A",
      p_amount: 100,
    });
    expect(result.id).toBe("pred-1");
    expect(result.amount).toBe(100);
  });

  it("surfaces the DB function error message (e.g. insufficient balance)", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "Insufficient balance" } });

    await expect(
      placePrediction(
        "p1",
        { matchId: 42, matchName: "A vs B", game: "lol", winnerId: 7, winnerName: "Team A" },
        100
      )
    ).rejects.toThrow("Insufficient balance");
  });
});

describe("resolvePredictionsForMatch", () => {
  it("settles and pays the whole match in one atomic RPC", async () => {
    mockRpc.mockResolvedValue({ data: 2, error: null });

    const settled = await resolvePredictionsForMatch(42, 7);

    expect(mockRpc).toHaveBeenCalledWith("settle_esport_match", {
      p_match_id: 42,
      p_winner_id: 7,
    });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(settled).toBe(2);
  });

  it("throws when the settlement fails so the caller records the failure", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    await expect(resolvePredictionsForMatch(42, 7)).rejects.toThrow(
      "Failed to settle predictions"
    );
  });
});
