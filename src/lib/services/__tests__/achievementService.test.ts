import { describe, it, expect, beforeEach, vi } from "vitest";

// --- Mock setup ---

const mockFrom = vi.fn();

const mockSupabaseClient = {
  from: mockFrom,
};

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => mockSupabaseClient),
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Import after mocks
import { AchievementService } from "@/lib/services/achievementService";
import { logger } from "@/lib/logger";

// --- Helpers ---

function buildChain(result: { data?: unknown; count?: number | null; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const resolver = () => Promise.resolve(result);
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.single = vi.fn(resolver);
  chain.then = vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve));
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// --- Sample catalog data ---

const CATALOG_ROWS = [
  {
    key: "library_1",
    category: "library",
    tier: "bronze",
    threshold: 1,
    xp_value: 10,
    icon: "BookOpen",
    name_fr: "Premier jeu",
    name_en: "First game",
    description_fr: "Ajoutez votre premier jeu",
    description_en: "Add your first game",
    sort_order: 1,
  },
  {
    key: "library_5",
    category: "library",
    tier: "bronze",
    threshold: 5,
    xp_value: 25,
    icon: "BookOpen",
    name_fr: "Collectionneur",
    name_en: "Collector",
    description_fr: "Ajoutez 5 jeux",
    description_en: "Add 5 games",
    sort_order: 2,
  },
];

describe("AchievementService.fetchPlayerAchievements", () => {
  it("should return localized achievements with unlock status (Req 8.1)", async () => {
    const catalogChain = buildChain({ data: CATALOG_ROWS, error: null });
    const unlockedChain = buildChain({
      data: [{ achievement_key: "library_1", unlocked_at: "2024-01-15T10:00:00Z" }],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "achievement_catalog") return catalogChain;
      if (table === "player_achievements") return unlockedChain;
      return buildChain({ data: [], error: null });
    });

    const result = await AchievementService.fetchPlayerAchievements("player-1", "fr");

    expect(result).toHaveLength(2);

    // First achievement: unlocked, French locale
    expect(result[0]).toEqual({
      key: "library_1",
      category: "library",
      tier: "bronze",
      threshold: 1,
      xpValue: 10,
      icon: "BookOpen",
      name: "Premier jeu",
      description: "Ajoutez votre premier jeu",
      unlockedAt: "2024-01-15T10:00:00Z",
      sortOrder: 1,
    });

    // Second achievement: locked
    expect(result[1].unlockedAt).toBeNull();
    expect(result[1].name).toBe("Collectionneur");
  });

  it("should return English names when locale is en", async () => {
    const catalogChain = buildChain({ data: CATALOG_ROWS, error: null });
    const unlockedChain = buildChain({ data: [], error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "achievement_catalog") return catalogChain;
      if (table === "player_achievements") return unlockedChain;
      return buildChain({ data: [], error: null });
    });

    const result = await AchievementService.fetchPlayerAchievements("player-1", "en");

    expect(result[0].name).toBe("First game");
    expect(result[0].description).toBe("Add your first game");
    expect(result[1].name).toBe("Collector");
  });

  it("should return empty array on catalog DB error", async () => {
    const catalogChain = buildChain({
      data: null,
      error: { code: "PGRST301", message: "DB error" },
    });

    mockFrom.mockImplementation(() => catalogChain);

    const result = await AchievementService.fetchPlayerAchievements("player-1", "fr");

    expect(result).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to fetch achievement catalog",
      expect.objectContaining({ playerId: "player-1" })
    );
  });

  it("should return empty array when catalog is empty", async () => {
    const catalogChain = buildChain({ data: [], error: null });

    mockFrom.mockImplementation(() => catalogChain);

    const result = await AchievementService.fetchPlayerAchievements("player-1", "fr");

    expect(result).toEqual([]);
  });

  it("should return empty array on player_achievements DB error", async () => {
    const catalogChain = buildChain({ data: CATALOG_ROWS, error: null });
    const unlockedChain = buildChain({
      data: null,
      error: { code: "PGRST301", message: "DB error" },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "achievement_catalog") return catalogChain;
      if (table === "player_achievements") return unlockedChain;
      return buildChain({ data: [], error: null });
    });

    const result = await AchievementService.fetchPlayerAchievements("player-1", "fr");

    expect(result).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to fetch player achievements",
      expect.objectContaining({ playerId: "player-1" })
    );
  });
});

describe("AchievementService.fetchPlayerXp", () => {
  it("should return XP stats for a player with XP (Req 8.2)", async () => {
    const xpChain = buildChain({ data: { xp_total: 100 }, error: null });

    mockFrom.mockImplementation(() => xpChain);

    const result = await AchievementService.fetchPlayerXp("player-1");

    expect(result.xpTotal).toBe(100);
    expect(result.level).toBe(4); // floor(0.3 * sqrt(100)) + 1 = floor(3) + 1 = 4
    expect(result.progressPercent).toBeGreaterThanOrEqual(0);
    expect(result.progressPercent).toBeLessThanOrEqual(99);
    expect(result.currentLevelXp).toBeLessThan(result.nextLevelXp);
  });

  it("should return level 1 with 0 XP when player has no XP row (Req 4.6)", async () => {
    // PGRST116 = no rows found
    const xpChain = buildChain({
      data: null,
      error: { code: "PGRST116", message: "No rows found" },
    });

    mockFrom.mockImplementation(() => xpChain);

    const result = await AchievementService.fetchPlayerXp("player-1");

    expect(result.xpTotal).toBe(0);
    expect(result.level).toBe(1);
    expect(result.progressPercent).toBe(0);
  });

  it("should log error on unexpected DB error but still return stats", async () => {
    const xpChain = buildChain({
      data: null,
      error: { code: "PGRST500", message: "Server error" },
    });

    mockFrom.mockImplementation(() => xpChain);

    const result = await AchievementService.fetchPlayerXp("player-1");

    // Falls back to 0 XP
    expect(result.xpTotal).toBe(0);
    expect(result.level).toBe(1);
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to fetch player XP",
      expect.objectContaining({ playerId: "player-1" })
    );
  });
});
