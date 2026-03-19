import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IGDBGame } from "../../../src/types/igdb";

/**
 * Tests for IGDB platform import/sync (ensurePlatforms, linkPlatforms, syncGamePlatforms).
 * Mocks the Supabase client to test pure logic without DB.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

// --- Fluent mock Supabase client ---

/** Queue of responses returned by .single() or terminal calls */
let responseQueue: Array<{ data: unknown; error: unknown }> = [];
/** Tracks insert calls for assertions */
let insertCalls: Array<{ table: string; rows: unknown }> = [];

function createFluentChain(tableName: string) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.single = vi.fn(() => {
    const next = responseQueue.shift() ?? { data: null, error: null };
    return Promise.resolve(next);
  });
  chain.insert = vi.fn((rows: unknown) => {
    insertCalls.push({ table: tableName, rows });
    // If next response is queued for insert, use it; otherwise return success
    if (responseQueue.length > 0 && responseQueue[0] !== undefined) {
      const next = responseQueue.shift()!;
      // Insert can chain .select().single()
      const insertChain: Record<string, unknown> = { ...next };
      insertChain.select = vi.fn(() => insertChain);
      insertChain.single = vi.fn(() => Promise.resolve(next));
      return insertChain;
    }
    return {
      error: null,
      select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: null, error: null })) })),
    };
  });
  return chain;
}

const mockFrom = vi.fn((table: string) => createFluentChain(table));

vi.mock("../../../scripts/igdb-import/supabase-client", () => ({
  createScriptClient: () => ({ from: mockFrom }),
}));

const { ensurePlatforms, linkPlatforms, syncGamePlatforms } =
  await import("../../../scripts/igdb-import/platform-importer");

function makeIgdbGame(overrides: Partial<IGDBGame> = {}): IGDBGame {
  return { id: 1234, name: "Test Game", slug: "test-game", ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  responseQueue = [];
  insertCalls = [];
});

describe("ensurePlatforms", () => {
  it("returns empty array when game has no platforms", async () => {
    const game = makeIgdbGame({ platforms: [] });
    const result = await ensurePlatforms(game, false);
    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns empty array when platforms is undefined", async () => {
    const game = makeIgdbGame({ platforms: undefined });
    const result = await ensurePlatforms(game, false);
    expect(result).toEqual([]);
  });

  it("reuses existing platform by igdb_id", async () => {
    const game = makeIgdbGame({
      platforms: [{ id: 48, name: "PlayStation 4" }],
    });

    // Lookup: found existing platform
    responseQueue.push({ data: { id: "uuid-ps4" }, error: null });

    const result = await ensurePlatforms(game, false);

    expect(result).toEqual(["uuid-ps4"]);
    expect(mockFrom).toHaveBeenCalledWith("platforms");
  });

  it("creates new platform when not found by igdb_id", async () => {
    const game = makeIgdbGame({
      platforms: [{ id: 167, name: "PlayStation 5" }],
    });

    // Lookup: not found
    responseQueue.push({ data: null, error: null });
    // Insert platform: returns new id
    responseQueue.push({ data: { id: "uuid-new-ps5" }, error: null });

    const result = await ensurePlatforms(game, false);

    expect(result).toEqual(["uuid-new-ps5"]);
    // Should have inserted into platforms and platform_translations
    const platformInserts = insertCalls.filter((c) => c.table === "platforms");
    expect(platformInserts.length).toBeGreaterThanOrEqual(1);
  });

  it("uses fallback name when platform has no name", async () => {
    const game = makeIgdbGame({
      platforms: [{ id: 999, name: "" }],
    });

    // Lookup: not found
    responseQueue.push({ data: null, error: null });
    // Insert: returns new platform
    responseQueue.push({ data: { id: "uuid-fallback" }, error: null });

    const result = await ensurePlatforms(game, false);

    expect(result).toEqual(["uuid-fallback"]);
  });

  it("handles multiple platforms in one game", async () => {
    const game = makeIgdbGame({
      platforms: [
        { id: 48, name: "PlayStation 4" },
        { id: 49, name: "Xbox One" },
      ],
    });

    // Both exist
    responseQueue.push({ data: { id: "uuid-ps4" }, error: null });
    responseQueue.push({ data: { id: "uuid-xbox" }, error: null });

    const result = await ensurePlatforms(game, false);

    expect(result).toEqual(["uuid-ps4", "uuid-xbox"]);
  });
});

describe("linkPlatforms", () => {
  it("does nothing when platformIds is empty", async () => {
    await linkPlatforms("game-uuid", []);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("inserts game_platforms rows", async () => {
    await linkPlatforms("game-uuid", ["plat-1", "plat-2"]);

    expect(mockFrom).toHaveBeenCalledWith("game_platforms");
    const gpInserts = insertCalls.filter((c) => c.table === "game_platforms");
    expect(gpInserts).toHaveLength(1);
    expect(gpInserts[0].rows).toEqual([
      { game_id: "game-uuid", platform_id: "plat-1" },
      { game_id: "game-uuid", platform_id: "plat-2" },
    ]);
  });
});

describe("syncGamePlatforms", () => {
  it("returns 0 when game has no platforms", async () => {
    const game = makeIgdbGame({ platforms: [] });
    const result = await syncGamePlatforms("game-uuid", game, false);
    expect(result).toBe(0);
  });
});
