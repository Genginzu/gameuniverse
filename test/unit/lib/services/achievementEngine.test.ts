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

vi.mock("@/lib/services/levelSystem", () => ({
  computeLevel: vi.fn((xp: number) => Math.floor(0.3 * Math.sqrt(Math.max(xp, 0))) + 1),
}));

// Import after mocks
import { AchievementEngine } from "@/lib/services/achievementEngine";
import { logger } from "@/lib/logger";

// --- Helpers ---

/** Builds a chainable mock for supabase .from().select().eq().order() etc.
 *  The chain is thenable: `await supabase.from(t).select(s).eq(k,v)` resolves to result. */
function buildChain(result: { data?: unknown; count?: number | null; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const resolver = () => Promise.resolve(result);
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(resolver);
  chain.single = vi.fn(resolver);
  chain.insert = vi.fn(resolver);
  chain.upsert = vi.fn(resolver);
  chain.update = vi.fn(() => chain);
  // Make the chain itself thenable so `await chain` resolves to result
  chain.then = vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve));
  return chain;
}

/** Configures mockFrom to return specific chains per table name. */
function setupFromMock(tableMap: Record<string, ReturnType<typeof buildChain>>) {
  mockFrom.mockImplementation((table: string) => {
    if (tableMap[table]) return tableMap[table];
    // Fallback: empty success
    return buildChain({ data: [], error: null });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AchievementEngine.evaluate", () => {
  it("should unlock achievements when player meets thresholds (Req 3.1, 3.6)", async () => {
    const catalogChain = buildChain({
      data: [
        { key: "library_1", threshold: 1, xp_value: 10 },
        { key: "library_5", threshold: 5, xp_value: 25 },
      ],
      error: null,
    });

    const unlockedChain = buildChain({ data: [], error: null });

    // user_library count = 7 (meets both thresholds)
    const libraryCountChain = buildChain({ data: null, count: 7, error: null });

    const insertChain = buildChain({ error: null });
    // player_xp .select().eq().single() → no existing XP row
    const xpSelectChain = buildChain({ data: null, error: null });

    const profileChain = buildChain({ data: null, error: null });

    // Track which table is called and return appropriate chain
    let insertCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      switch (table) {
        case "achievement_catalog":
          return catalogChain;
        case "player_achievements": {
          // First call = select unlocked, subsequent = inserts
          if (insertCallCount === 0) {
            insertCallCount++;
            return unlockedChain;
          }
          return insertChain;
        }
        case "user_library":
          return libraryCountChain;
        case "player_xp":
          // First call = select xp_total, second = upsert
          return xpSelectChain;
        case "profiles":
          return profileChain;
        default:
          return buildChain({ data: [], error: null });
      }
    });

    const result = await AchievementEngine.evaluate("user-1", "library");

    expect(result.newlyUnlocked).toHaveLength(2);
    expect(result.newlyUnlocked[0]).toEqual({ key: "library_1", xpAwarded: 10 });
    expect(result.newlyUnlocked[1]).toEqual({ key: "library_5", xpAwarded: 25 });
    expect(result.totalXpAwarded).toBe(35);
  });

  it("should return EMPTY_RESULT when catalog is empty (Req 3.8)", async () => {
    const catalogChain = buildChain({ data: [], error: null });
    setupFromMock({ achievement_catalog: catalogChain });

    const result = await AchievementEngine.evaluate("user-1", "library");

    expect(result).toEqual({
      newlyUnlocked: [],
      totalXpAwarded: 0,
      newLevel: null,
    });
  });

  it("should return EMPTY_RESULT when catalog data is null (Req 3.8)", async () => {
    const catalogChain = buildChain({ data: null, error: null });
    setupFromMock({ achievement_catalog: catalogChain });

    const result = await AchievementEngine.evaluate("user-1", "reviews");

    expect(result).toEqual({
      newlyUnlocked: [],
      totalXpAwarded: 0,
      newLevel: null,
    });
  });

  it("should skip already unlocked achievements — no duplicates (Req 3.7)", async () => {
    const catalogChain = buildChain({
      data: [
        { key: "library_1", threshold: 1, xp_value: 10 },
        { key: "library_5", threshold: 5, xp_value: 25 },
      ],
      error: null,
    });

    // library_1 already unlocked
    const unlockedChain = buildChain({
      data: [{ achievement_key: "library_1" }],
      error: null,
    });

    const libraryCountChain = buildChain({ data: null, count: 7, error: null });

    const insertChain = buildChain({ error: null });
    const xpSelectChain = buildChain({ data: { xp_total: 10 }, error: null });
    const profileChain = buildChain({ data: null, error: null });

    let playerAchievementsCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      switch (table) {
        case "achievement_catalog":
          return catalogChain;
        case "player_achievements": {
          if (playerAchievementsCallCount === 0) {
            playerAchievementsCallCount++;
            return unlockedChain;
          }
          return insertChain;
        }
        case "user_library":
          return libraryCountChain;
        case "player_xp":
          return xpSelectChain;
        case "profiles":
          return profileChain;
        default:
          return buildChain({ data: [], error: null });
      }
    });

    const result = await AchievementEngine.evaluate("user-1", "library");

    // Only library_5 should be newly unlocked (library_1 was already unlocked)
    expect(result.newlyUnlocked).toHaveLength(1);
    expect(result.newlyUnlocked[0].key).toBe("library_5");
    expect(result.totalXpAwarded).toBe(25);
  });

  it("should not unlock when player count is below threshold", async () => {
    const catalogChain = buildChain({
      data: [{ key: "library_5", threshold: 5, xp_value: 25 }],
      error: null,
    });

    const unlockedChain = buildChain({ data: [], error: null });

    // Player only has 3 games — below threshold of 5
    const libraryCountChain = buildChain({ data: null, count: 3, error: null });

    let playerAchievementsCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      switch (table) {
        case "achievement_catalog":
          return catalogChain;
        case "player_achievements": {
          if (playerAchievementsCallCount === 0) {
            playerAchievementsCallCount++;
            return unlockedChain;
          }
          return buildChain({ error: null });
        }
        case "user_library":
          return libraryCountChain;
        default:
          return buildChain({ data: [], error: null });
      }
    });

    const result = await AchievementEngine.evaluate("user-1", "library");

    expect(result).toEqual({
      newlyUnlocked: [],
      totalXpAwarded: 0,
      newLevel: null,
    });
  });

  it("should return EMPTY_RESULT and log error on catalog DB error", async () => {
    const catalogChain = buildChain({
      data: null,
      error: { code: "PGRST301", message: "DB error" },
    });
    setupFromMock({ achievement_catalog: catalogChain });

    const result = await AchievementEngine.evaluate("user-1", "library");

    expect(result).toEqual({
      newlyUnlocked: [],
      totalXpAwarded: 0,
      newLevel: null,
    });
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to fetch achievement catalog",
      expect.objectContaining({ userId: "user-1", category: "library" })
    );
  });

  it("should handle UNIQUE constraint violation (23505) gracefully", async () => {
    const catalogChain = buildChain({
      data: [{ key: "library_1", threshold: 1, xp_value: 10 }],
      error: null,
    });

    const unlockedChain = buildChain({ data: [], error: null });

    const libraryCountChain = buildChain({ data: null, count: 5, error: null });

    // Insert returns UNIQUE violation
    const insertChain = buildChain({
      error: { code: "23505", message: "duplicate key" },
    });

    let playerAchievementsCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      switch (table) {
        case "achievement_catalog":
          return catalogChain;
        case "player_achievements": {
          if (playerAchievementsCallCount === 0) {
            playerAchievementsCallCount++;
            return unlockedChain;
          }
          return insertChain;
        }
        case "user_library":
          return libraryCountChain;
        default:
          return buildChain({ data: [], error: null });
      }
    });

    const result = await AchievementEngine.evaluate("user-1", "library");

    // 23505 is silently skipped, so no newly unlocked
    expect(result).toEqual({
      newlyUnlocked: [],
      totalXpAwarded: 0,
      newLevel: null,
    });
  });

  it("should return EMPTY_RESULT on unexpected exception", async () => {
    // Force createRouteHandlerClient to throw
    mockFrom.mockImplementation(() => {
      throw new Error("Unexpected crash");
    });

    const result = await AchievementEngine.evaluate("user-1", "library");

    expect(result).toEqual({
      newlyUnlocked: [],
      totalXpAwarded: 0,
      newLevel: null,
    });
    expect(logger.error).toHaveBeenCalledWith(
      "Achievement evaluation failed",
      expect.objectContaining({ userId: "user-1", category: "library" })
    );
  });
});
