import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

const mockGetTeams = vi.fn();
const mockGetTeamById = vi.fn();

vi.mock("@/lib/pandascore/client", () => ({
  getTeams: (...args: unknown[]) => mockGetTeams(...args),
  getTeamById: (...args: unknown[]) => mockGetTeamById(...args),
}));

function makeTeam(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "T1",
    slug: "t1",
    acronym: "T1",
    image_url: "https://t1.png",
    location: "KR",
    current_videogame: { id: 1, name: "League of Legends", slug: "lol" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("esportTeamService", () => {
  async function loadService() {
    return import("@/lib/services/esportTeamService");
  }

  it("maps team list correctly", async () => {
    mockGetTeams.mockResolvedValue([makeTeam()]);
    const { getTeamsList } = await loadService();
    const teams = await getTeamsList();

    expect(teams).toHaveLength(1);
    expect(teams[0]).toEqual({
      id: 1,
      name: "T1",
      slug: "t1",
      acronym: "T1",
      imageUrl: "https://t1.png",
      location: "KR",
      game: "League of Legends",
    });
  });

  it("passes search param", async () => {
    mockGetTeams.mockResolvedValue([]);
    const { getTeamsList } = await loadService();
    await getTeamsList({ search: "fnatic" });

    expect(mockGetTeams).toHaveBeenCalledWith(
      expect.objectContaining({ "search[name]": "fnatic" })
    );
  });

  it("caches team list", async () => {
    mockGetTeams.mockResolvedValue([makeTeam()]);
    const { getTeamsList } = await loadService();
    await getTeamsList();
    await getTeamsList();
    expect(mockGetTeams).toHaveBeenCalledTimes(1);
  });

  it("fetches team detail with players", async () => {
    mockGetTeamById.mockResolvedValue({
      ...makeTeam(),
      players: [
        {
          id: 10,
          name: "Faker",
          first_name: "Sang-hyeok",
          last_name: "Lee",
          image_url: "https://faker.png",
          role: "Mid",
          nationality: "KR",
        },
      ],
    });

    const { getTeamDetail } = await loadService();
    const detail = await getTeamDetail(1);

    expect(detail.name).toBe("T1");
    expect(detail.players).toHaveLength(1);
    expect(detail.players[0].name).toBe("Faker");
    expect(detail.players[0].role).toBe("Mid");
  });

  it("throws on error", async () => {
    mockGetTeams.mockRejectedValue(new Error("fail"));
    const { getTeamsList } = await loadService();
    await expect(getTeamsList()).rejects.toThrow("fail");
  });
});
