import { describe, test, expect, beforeEach, vi } from "vitest";

let mockFetchPlayer: any;
let mockValidateId: any;

vi.mock("@/lib/services/playerService", () => ({
  PlayerService: {
    fetchPlayerDetailsFromDB: (...args: any[]) =>
      mockFetchPlayer ? mockFetchPlayer(...args) : Promise.resolve(null),
    validatePlayerId: (id: string) =>
      mockValidateId ? mockValidateId(id) : true,
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("@/app/api/players/[id]/route");

function makeRequest(url: string) {
  return new Request(url) as any;
}

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  mockFetchPlayer = undefined;
  mockValidateId = undefined;
});

describe("GET /api/players/[id]", () => {
  test("returns player profile", async () => {
    const player = { id: "550e8400-e29b-41d4-a716-446655440000", username: "gamer1" };
    mockFetchPlayer = () => Promise.resolve(player);

    const res = await GET(
      makeRequest("http://localhost/api/players/550e8400-e29b-41d4-a716-446655440000"),
      makeParams("550e8400-e29b-41d4-a716-446655440000")
    );
    expect(res.status).toBe(200);
    expect((await res.json()).player.username).toBe("gamer1");
  });

  test("returns 404 when player not found", async () => {
    mockFetchPlayer = () => Promise.resolve(null);

    const res = await GET(
      makeRequest("http://localhost/api/players/550e8400-e29b-41d4-a716-446655440000"),
      makeParams("550e8400-e29b-41d4-a716-446655440000")
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Player not found" });
  });

  test("returns 400 for invalid player ID format", async () => {
    mockValidateId = () => false;

    const res = await GET(
      makeRequest("http://localhost/api/players/not-a-uuid"),
      makeParams("not-a-uuid")
    );
    expect(res.status).toBe(400);
  });

  test("returns 500 on unexpected error", async () => {
    mockFetchPlayer = () => { throw new Error("DB crash"); };

    const res = await GET(
      makeRequest("http://localhost/api/players/550e8400-e29b-41d4-a716-446655440000"),
      makeParams("550e8400-e29b-41d4-a716-446655440000")
    );
    expect(res.status).toBe(500);
  });
});
