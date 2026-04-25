import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }));
const mockUpdate = vi.fn(() => ({ eq: vi.fn() }));
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    order: vi.fn(() => ({
      ascending: false,
      limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  })),
  update: mockUpdate,
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() =>
    Promise.resolve({ from: mockFrom })
  ),
}));

vi.mock("@/lib/services/coinService", () => ({
  CoinService: {
    debitCoins: vi.fn(),
    creditCoins: vi.fn(),
  },
}));

vi.mock("@/lib/pandascore/client", () => ({
  getMatchById: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("esportPredictionService", () => {
  it("placePrediction deducts coins and inserts prediction", async () => {
    const { CoinService } = await import("@/lib/services/coinService");

    mockSingle.mockResolvedValue({
      data: {
        id: "pred-1",
        player_id: "user-1",
        match_id: 100,
        match_name: "Final",
        game: "LoL",
        predicted_winner_id: 10,
        predicted_winner_name: "T1",
        amount: 50,
        status: "pending",
        payout: 0,
        created_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    });

    const { placePrediction } = await import("@/lib/services/esportPredictionService");
    const result = await placePrediction("user-1", 100, "Final", "LoL", 10, "T1", 50);

    expect(CoinService.debitCoins).toHaveBeenCalledWith(
      "user-1", 50, "prediction", undefined, undefined, expect.any(String)
    );
    expect(result.matchId).toBe(100);
    expect(result.amount).toBe(50);
    expect(result.status).toBe("pending");
  });

  it("getLeaderboard returns sorted entries", async () => {
    // Override from mock for leaderboard view
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve({
              data: [
                { player_id: "p1", total_predictions: 10, correct_predictions: 7, total_profit: 500, accuracy_rate: 70 },
                { player_id: "p2", total_predictions: 5, correct_predictions: 2, total_profit: -100, accuracy_rate: 40 },
              ],
              error: null,
            })
          ),
        })),
      })),
    });

    const { getLeaderboard } = await import("@/lib/services/esportPredictionService");
    const lb = await getLeaderboard();

    expect(lb).toHaveLength(2);
    expect(lb[0].playerId).toBe("p1");
    expect(lb[0].totalProfit).toBe(500);
  });

  it("mapPrediction maps all fields correctly", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: "pred-2",
        player_id: "user-2",
        match_id: 200,
        match_name: "Semi",
        game: "Valorant",
        predicted_winner_id: 20,
        predicted_winner_name: "Fnatic",
        amount: 100,
        status: "won",
        payout: 200,
        created_at: "2026-02-01T00:00:00Z",
      },
      error: null,
    });

    const { placePrediction } = await import("@/lib/services/esportPredictionService");
    const result = await placePrediction("user-2", 200, "Semi", "Valorant", 20, "Fnatic", 100);

    expect(result.id).toBe("pred-2");
    expect(result.game).toBe("Valorant");
    expect(result.predictedWinnerName).toBe("Fnatic");
    expect(result.payout).toBe(200);
  });
});
