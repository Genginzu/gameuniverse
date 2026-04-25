import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

const mockGetPlayers = vi.fn();
const mockGetPlayerById = vi.fn();

vi.mock("@/lib/pandascore/client", () => ({
  getPlayers: (...args: unknown[]) => mockGetPlayers(...args),
  getPlayerById: (...args: unknown[]) => mockGetPlayerById(...args),
}));

function makePlayer(overrides: Record<string, unknown> = {}) {
  return {
    id: 1, name: "Faker", slug: "faker",
    first_name: "Sang-hyeok", last_name: "Lee",
    nationality: "KR", image_url: "https://faker.png", role: "Mid",
    current_team: { id: 10, name: "T1", slug: "t1", acronym: "T1", image_url: "https://t1.png", location: "KR", current_videogame: null },
    current_videogame: { id: 1, name: "League of Legends", slug: "lol" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("esportPlayerService", () => {
  async function loadService() {
    return import("@/lib/services/esportPlayerService");
  }

  it("maps player list correctly", async () => {
    mockGetPlayers.mockResolvedValue([makePlayer()]);
    const { getPlayersList } = await loadService();
    const players = await getPlayersList();

    expect(players).toHaveLength(1);
    expect(players[0]).toEqual({
      id: 1, name: "Faker", slug: "faker",
      firstName: "Sang-hyeok", lastName: "Lee",
      nationality: "KR", imageUrl: "https://faker.png", role: "Mid",
      teamName: "T1", game: "League of Legends",
    });
  });

  it("passes search param", async () => {
    mockGetPlayers.mockResolvedValue([]);
    const { getPlayersList } = await loadService();
    await getPlayersList({ search: "caps" });

    expect(mockGetPlayers).toHaveBeenCalledWith(
      expect.objectContaining({ "search[name]": "caps" }),
    );
  });

  it("caches player list", async () => {
    mockGetPlayers.mockResolvedValue([makePlayer()]);
    const { getPlayersList } = await loadService();
    await getPlayersList();
    await getPlayersList();
    expect(mockGetPlayers).toHaveBeenCalledTimes(1);
  });

  it("fetches player detail with team image", async () => {
    mockGetPlayerById.mockResolvedValue(makePlayer());
    const { getPlayerDetail } = await loadService();
    const detail = await getPlayerDetail(1);

    expect(detail.name).toBe("Faker");
    expect(detail.teamName).toBe("T1");
    expect(detail.teamImageUrl).toBe("https://t1.png");
  });

  it("throws on error", async () => {
    mockGetPlayers.mockRejectedValue(new Error("fail"));
    const { getPlayersList } = await loadService();
    await expect(getPlayersList()).rejects.toThrow("fail");
  });
});
