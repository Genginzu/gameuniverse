import { describe, it, expect, beforeEach, vi } from "vitest";

// --- Mock setup ---

const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockAdminClient = { rpc: mockRpc, from: mockFrom };
const mockRouteClient = { from: mockFrom };

// placePrediction + resolve writes use the service-role client (issue #372).
vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: vi.fn(() => mockAdminClient),
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => mockRouteClient),
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { mockCreditCoins } = vi.hoisted(() => ({ mockCreditCoins: vi.fn() }));
vi.mock("@/lib/services/coinService", () => ({
  CoinService: { creditCoins: mockCreditCoins },
}));

vi.mock("@/lib/pandascore/client", () => ({ getMatchById: vi.fn() }));

import { placePrediction, resolvePredictionsForMatch } from "@/lib/services/esportPredictionService";

function buildChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const resolver = () => Promise.resolve(result);
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.single = vi.fn(resolver);
  chain.then = vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve));
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("placePrediction", () => {
  it("calls the atomic SECURITY DEFINER RPC via the service-role client", async () => {
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
  it("credits the winner payout via the coin service and marks predictions", async () => {
    const pending = [
      {
        id: "pred-1",
        player_id: "p1",
        match_id: 42,
        match_name: "A vs B",
        predicted_winner_id: 7,
        amount: 100,
      },
      {
        id: "pred-2",
        player_id: "p2",
        match_id: 42,
        match_name: "A vs B",
        predicted_winner_id: 9,
        amount: 50,
      },
    ];

    // First .from() = select pending; subsequent = conditional update claims.
    let call = 0;
    mockFrom.mockImplementation(() => {
      call += 1;
      if (call === 1) return buildChain({ data: pending, error: null });
      return buildChain({ data: [{ id: "claimed" }], error: null });
    });

    const resolved = await resolvePredictionsForMatch(42, 7);

    expect(resolved).toBe(2);
    // Only p1 predicted the actual winner (id 7) → credited 200 (2x).
    expect(mockCreditCoins).toHaveBeenCalledTimes(1);
    expect(mockCreditCoins).toHaveBeenCalledWith(
      "p1",
      200,
      "prediction_win",
      undefined,
      undefined,
      expect.stringContaining("A vs B")
    );
  });

  it("does not credit a prediction already settled by a concurrent run", async () => {
    const pending = [
      { id: "pred-1", player_id: "p1", match_id: 42, match_name: "A vs B", predicted_winner_id: 7, amount: 100 },
    ];
    let call = 0;
    mockFrom.mockImplementation(() => {
      call += 1;
      if (call === 1) return buildChain({ data: pending, error: null });
      return buildChain({ data: [], error: null });
    });

    const resolved = await resolvePredictionsForMatch(42, 7);

    expect(resolved).toBe(0);
    expect(mockCreditCoins).not.toHaveBeenCalled();
  });

  it("returns 0 when there are no pending predictions", async () => {
    mockFrom.mockImplementation(() => buildChain({ data: [], error: null }));

    const resolved = await resolvePredictionsForMatch(42, 7);

    expect(resolved).toBe(0);
    expect(mockCreditCoins).not.toHaveBeenCalled();
  });
});
