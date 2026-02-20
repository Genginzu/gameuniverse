import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock functions
const mockRpc = vi.fn();
const mockFrom = vi.fn();

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
};

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

import { GET } from "@/app/api/games/[slug]/price-history/route";

const GAME_ID = "game-uuid-123";
const GAME_SLUG = "test-game";

function makeRequest(slug: string, queryParams: Record<string, string> = {}) {
  const params = new URLSearchParams(queryParams);
  const url = `http://localhost/api/games/${slug}/price-history?${params.toString()}`;
  return new NextRequest(url);
}

function makeRouteContext(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

/** Sets up mockFrom to resolve the game slug to a game_id (or error). */
function mockGameLookup(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
  };
  mockFrom.mockReturnValue(chain);
}

/** Sets up mockRpc to return history then stats in sequence. */
function mockRpcCalls(
  historyResult: { data: unknown; error: unknown },
  statsResult: { data: unknown; error: unknown }
) {
  mockRpc.mockResolvedValueOnce(historyResult).mockResolvedValueOnce(statsResult);
}

const sampleHistory = [
  {
    id: "snap-1",
    game_id: GAME_ID,
    store_id: "store-1",
    store_name: "Steam",
    store_logo_url: "https://example.com/steam.png",
    price: 49.99,
    currency: "EUR",
    platform: "PC",
    recorded_at: "2024-06-01T12:00:00Z",
  },
  {
    id: "snap-2",
    game_id: GAME_ID,
    store_id: "store-1",
    store_name: "Steam",
    store_logo_url: "https://example.com/steam.png",
    price: 39.99,
    currency: "EUR",
    platform: "PC",
    recorded_at: "2024-07-01T12:00:00Z",
  },
];

const sampleStats = [
  {
    min_price: 39.99,
    max_price: 49.99,
    avg_price: 44.99,
    currency: "EUR",
    total_snapshots: 2,
  },
];

describe("/api/games/[slug]/price-history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with valid history and stats data", async () => {
    mockGameLookup({ data: { id: GAME_ID }, error: null });
    mockRpcCalls({ data: sampleHistory, error: null }, { data: sampleStats, error: null });

    const request = makeRequest(GAME_SLUG, { period: "1y" });
    const response = await GET(request, makeRouteContext(GAME_SLUG));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.history).toHaveLength(2);
    expect(body.history[0].store_name).toBe("Steam");
    expect(body.history[0].price).toBe(49.99);
    expect(body.stats.min_price).toBe(39.99);
    expect(body.stats.max_price).toBe(49.99);
    expect(body.stats.avg_price).toBe(44.99);
    expect(body.stats.total_snapshots).toBe(2);
  });

  it("should return 404 when game slug does not exist", async () => {
    mockGameLookup({
      data: null,
      error: { code: "PGRST116", message: "Not found" },
    });

    const request = makeRequest("nonexistent-game", { period: "1y" });
    const response = await GET(request, makeRouteContext("nonexistent-game"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Game not found");
    // RPC should never be called when game is not found
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("should return 400 when period is invalid", async () => {
    const request = makeRequest(GAME_SLUG, { period: "2w" });
    const response = await GET(request, makeRouteContext(GAME_SLUG));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid period");
    // Neither game lookup nor RPC should be called for invalid params
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("should return 200 with empty history when no price history exists", async () => {
    mockGameLookup({ data: { id: GAME_ID }, error: null });
    mockRpcCalls(
      { data: [], error: null },
      {
        data: [
          {
            min_price: 0,
            max_price: 0,
            avg_price: 0,
            currency: "EUR",
            total_snapshots: 0,
          },
        ],
        error: null,
      }
    );

    const request = makeRequest(GAME_SLUG, { period: "all" });
    const response = await GET(request, makeRouteContext(GAME_SLUG));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.history).toEqual([]);
    expect(body.stats.total_snapshots).toBe(0);
  });
});
