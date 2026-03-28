import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IGDBGame } from "../../../src/types/igdb";

/**
 * Tests for video import within game-importer (createVideos).
 * Since createVideos is private, we test it through importGameFromIGDB.
 * Validates: Requirements 2.1, 2.8, 4.3
 */

// --- Fluent mock Supabase client ---

let responseQueue: Array<{ data: unknown; error: unknown }> = [];
let insertCalls: Array<{ table: string; rows: unknown }> = [];

function createFluentChain(tableName: string) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.single = vi.fn(() => {
    const next = responseQueue.shift() ?? { data: null, error: null };
    return Promise.resolve(next);
  });
  chain.insert = vi.fn((rows: unknown) => {
    insertCalls.push({ table: tableName, rows });
    const next = responseQueue.shift() ?? { data: null, error: null };
    const insertChain: Record<string, unknown> = { ...next };
    insertChain.select = vi.fn(() => insertChain);
    insertChain.single = vi.fn(() => Promise.resolve(next));
    return insertChain;
  });
  chain.upsert = vi.fn(() => {
    const next = responseQueue.shift() ?? { data: null, error: null };
    return Promise.resolve(next);
  });
  return chain;
}

const mockFrom = vi.fn((table: string) => createFluentChain(table));

vi.mock("../../../scripts/igdb-import/shared/supabase-client", () => ({
  createScriptClient: () => ({ from: mockFrom }),
}));

vi.mock("../../../src/lib/services/igdbService", () => ({
  IGDBService: {
    getGameDetails: vi.fn(),
    buildImageUrl: vi.fn((_id: string, _size: string) => "https://img.example.com/mock.jpg"),
    getTimeToBeat: vi.fn().mockResolvedValue(null),
    getGameVersions: vi.fn().mockResolvedValue([]),
    getDlcExtensions: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../../../scripts/igdb-import/shared/color-extractor", () => ({
  extractColorsFromCover: vi.fn().mockResolvedValue(null),
}));

vi.mock("../../../scripts/igdb-import/games/game-sync", () => ({
  syncExistingGame: vi.fn(),
}));

vi.mock("../../../scripts/igdb-import/games/platform-importer", () => ({
  ensurePlatforms: vi.fn().mockResolvedValue([]),
  linkPlatforms: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../src/lib/utils/dlcExtensionUtils", () => ({
  collectDlcExtensionIds: vi.fn().mockReturnValue([]),
  transformIgdbToDlcExtensionRow: vi.fn(),
}));

const { IGDBService } = await import("../../../src/lib/services/igdbService");
const { importGameFromIGDB } = await import("../../../scripts/igdb-import/games/game-importer");

const GAME_UUID = "game-uuid-123";
const GAME_SLUG = "test-game";

function makeIgdbGame(overrides: Partial<IGDBGame> = {}): IGDBGame {
  return {
    id: 1234,
    name: "Test Game",
    slug: GAME_SLUG,
    ...overrides,
  };
}

/** Enqueue standard responses: check existing (not found) + insert game */
function enqueueNewGameFlow() {
  // Check existing game → not found (PGRST116)
  responseQueue.push({ data: null, error: { code: "PGRST116", message: "not found" } });
  // ensureGenres — no genres
  // Insert game → success
  responseQueue.push({ data: { id: GAME_UUID, slug: GAME_SLUG }, error: null });
  // createTranslations insert
  responseQueue.push({ data: null, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
  responseQueue = [];
  insertCalls = [];
  vi.mocked(IGDBService.getGameDetails).mockResolvedValue(makeIgdbGame());
});

describe("createVideos (via importGameFromIGDB)", () => {
  it("inserts videos when IGDB game has videos (Req 2.1)", async () => {
    const videos = [
      { video_id: "abc123", name: "Trailer 1" },
      { video_id: "def456", name: "Gameplay" },
    ];
    vi.mocked(IGDBService.getGameDetails).mockResolvedValue(makeIgdbGame({ videos }));
    enqueueNewGameFlow();
    // game_videos insert → success
    responseQueue.push({ data: null, error: null });

    const result = await importGameFromIGDB(1234, false);

    expect(result.success).toBe(true);
    const videoInserts = insertCalls.filter((c) => c.table === "game_videos");
    expect(videoInserts).toHaveLength(1);

    const rows = videoInserts[0].rows as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      game_id: GAME_UUID,
      url: "https://www.youtube.com/watch?v=abc123",
      title: "Trailer 1",
      video_type: "trailer",
      display_order: 0,
      is_featured: true,
    });
    expect(rows[1]).toMatchObject({
      game_id: GAME_UUID,
      url: "https://www.youtube.com/watch?v=def456",
      title: "Gameplay",
      display_order: 1,
      is_featured: false,
    });
  });

  it("skips video insertion when no videos (Req 2.8)", async () => {
    vi.mocked(IGDBService.getGameDetails).mockResolvedValue(makeIgdbGame({ videos: undefined }));
    enqueueNewGameFlow();

    const result = await importGameFromIGDB(1234, false);

    expect(result.success).toBe(true);
    const videoInserts = insertCalls.filter((c) => c.table === "game_videos");
    expect(videoInserts).toHaveLength(0);
  });

  it("skips video insertion when videos is empty array (Req 2.8)", async () => {
    vi.mocked(IGDBService.getGameDetails).mockResolvedValue(makeIgdbGame({ videos: [] }));
    enqueueNewGameFlow();

    const result = await importGameFromIGDB(1234, false);

    expect(result.success).toBe(true);
    const videoInserts = insertCalls.filter((c) => c.table === "game_videos");
    expect(videoInserts).toHaveLength(0);
  });

  it("continues without error on DB insert failure (Req 4.3)", async () => {
    const videos = [{ video_id: "fail123", name: "Failing Video" }];
    vi.mocked(IGDBService.getGameDetails).mockResolvedValue(makeIgdbGame({ videos }));
    enqueueNewGameFlow();
    // game_videos insert → DB error
    responseQueue.push({ data: null, error: { message: "duplicate key" } });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await importGameFromIGDB(1234, false);

    expect(result.success).toBe(true);
    expect(result.gameSlug).toBe(GAME_SLUG);
    consoleSpy.mockRestore();
  });

  it("logs video count in verbose mode (Req 4.2)", async () => {
    const videos = [
      { video_id: "v1", name: "Vid 1" },
      { video_id: "v2", name: "Vid 2" },
      { video_id: "v3", name: "Vid 3" },
    ];
    vi.mocked(IGDBService.getGameDetails).mockResolvedValue(makeIgdbGame({ videos }));
    enqueueNewGameFlow();
    // game_videos insert → success
    responseQueue.push({ data: null, error: null });

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await importGameFromIGDB(1234, true);

    const videoLogCalls = consoleSpy.mock.calls.filter(
      (args) => typeof args[0] === "string" && args[0].includes("Imported 3 videos")
    );
    expect(videoLogCalls.length).toBeGreaterThanOrEqual(1);
    consoleSpy.mockRestore();
  });
});
