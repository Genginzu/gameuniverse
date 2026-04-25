import { describe, test, expect, beforeEach, vi } from "vitest";

let mockRpc: ReturnType<typeof vi.fn>;
let mockGetUser: ReturnType<typeof vi.fn>;

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      rpc: (...args: unknown[]) => mockRpc(...args),
      auth: { getUser: () => mockGetUser() },
    }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { GET } = await import("@/app/api/games/route");

function makeRequest(url: string) {
  return new Request(url) as any;
}

const EMPTY_RPC = {
  data: { games: [], totalCount: 0 },
  error: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRpc = vi.fn().mockResolvedValue(EMPTY_RPC);
  mockGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
});

describe("GET /api/games — esport filter", () => {
  test("passes p_esport=true when esport=true", async () => {
    const res = await GET(makeRequest("http://localhost/api/games?esport=true"));
    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith(
      "get_games_listing",
      expect.objectContaining({ p_esport: true }),
    );
  });

  test("passes p_esport=false when esport=false", async () => {
    const res = await GET(makeRequest("http://localhost/api/games?esport=false"));
    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith(
      "get_games_listing",
      expect.objectContaining({ p_esport: false }),
    );
  });

  test("passes p_esport=null when esport param is absent", async () => {
    const res = await GET(makeRequest("http://localhost/api/games"));
    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith(
      "get_games_listing",
      expect.objectContaining({ p_esport: null }),
    );
  });

  test("passes p_esport=null for invalid esport value", async () => {
    const res = await GET(makeRequest("http://localhost/api/games?esport=maybe"));
    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith(
      "get_games_listing",
      expect.objectContaining({ p_esport: null }),
    );
  });

  test("includes isEsport in response games", async () => {
    mockRpc.mockResolvedValue({
      data: {
        games: [{
          id: "1", slug: "lol", igdb_id: null, cover_image_url: null,
          background_image_url: null, background_color: null, release_date: null,
          metascore: null, created_at: "2024-01-01", title: "LoL",
          description: null, genres: [], developer: "Riot", publisher: "Riot",
          is_esport: true,
        }],
        totalCount: 1,
      },
      error: null,
    });

    const res = await GET(makeRequest("http://localhost/api/games?esport=true"));
    const body = await res.json();
    expect(body.games[0].isEsport).toBe(true);
  });
});
