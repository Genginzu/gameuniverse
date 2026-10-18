/**
 * Property-based tests for the real ImportOrchestrator (games bulk import).
 * IGDB fetching, the per-game importer and the dump pipeline are mocked; the
 * orchestration logic (pagination, limit/offset, filters, dry-run, counters)
 * runs for real.
 *
 * Properties: 5 (stats invariant), 6 (dry-run), 7 (limit), 8 (offset).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import type { IGDBGame } from "../../../src/types/igdb";
import type { CLIOptions } from "../../../scripts/igdb-import/shared/types";

const TEST_BATCH_SIZE = 7;

const mocks = vi.hoisted(() => ({
  importGameFromIGDB: vi.fn(),
  fetchGamesBatch: vi.fn(),
  fetchTotalCount: vi.fn(),
  downloadGameDumps: vi.fn(),
  assembleGamesFromDumps: vi.fn(),
  generateGamesSql: vi.fn(),
}));

vi.mock("../../../scripts/igdb-import/games/game-importer", () => ({
  importGameFromIGDB: mocks.importGameFromIGDB,
}));
vi.mock("../../../scripts/igdb-import/games/igdb-fetcher", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../scripts/igdb-import/games/igdb-fetcher")>()),
  BATCH_SIZE: TEST_BATCH_SIZE,
  fetchGamesBatch: mocks.fetchGamesBatch,
  fetchTotalCount: mocks.fetchTotalCount,
}));
vi.mock("../../../scripts/igdb-import/shared/dump-downloader", () => ({
  downloadGameDumps: mocks.downloadGameDumps,
}));
vi.mock("../../../scripts/igdb-import/games/dump-assembler", () => ({
  assembleGamesFromDumps: mocks.assembleGamesFromDumps,
}));
vi.mock("../../../scripts/igdb-import/games/sql-generator", () => ({
  generateGamesSql: mocks.generateGamesSql,
}));

const { ImportOrchestrator } = await import("../../../scripts/igdb-import/games/orchestrator");

type Outcome = "imported" | "synced" | "failed" | "thrown";

const FROM = new Date("2020-01-01T00:00:00Z");
const TO = new Date("2020-12-31T00:00:00Z");
const IN_RANGE_TS = Math.floor(new Date("2020-06-01T00:00:00Z").getTime() / 1000);

const gameArb = fc.record({
  notable: fc.boolean(),
  outcome: fc.constantFrom<Outcome>("imported", "synced", "failed", "thrown"),
});

function buildGames(specs: { notable: boolean }[]): IGDBGame[] {
  return specs.map(
    (spec, i) =>
      ({
        id: i + 1,
        name: `Game ${i + 1}`,
        first_release_date: IN_RANGE_TS,
        follows: spec.notable ? 1 : 0,
      }) as unknown as IGDBGame
  );
}

function options(overrides: Partial<CLIOptions> = {}): CLIOptions {
  return {
    dryRun: false,
    verbose: true,
    fromDate: FROM,
    toDate: TO,
    notableOnly: false,
    notNotable: false,
    source: "api",
    ...overrides,
  };
}

/** Serves `games` through the mocked IGDB API, honouring offset/limit like IGDB does. */
function serveFromApi(games: IGDBGame[]) {
  mocks.fetchGamesBatch.mockImplementation(
    async (_opts: CLIOptions, _rl: unknown, offset: number, limit: number) =>
      games.slice(offset, offset + limit)
  );
}

function scriptImporter(outcomes: Outcome[]) {
  mocks.importGameFromIGDB.mockImplementation(async (game: IGDBGame) => {
    const outcome = outcomes[game.id - 1];
    if (outcome === "thrown") throw new Error("boom");
    if (outcome === "failed") return { success: false, error: "db error" };
    return { success: true, synced: outcome === "synced" };
  });
}

describe("ImportOrchestrator (real orchestration, mocked IO)", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.fetchTotalCount.mockResolvedValue(0);
    mocks.downloadGameDumps.mockResolvedValue(new Map([["games", "games.csv"]]));
    mocks.generateGamesSql.mockResolvedValue(undefined);
  });

  it("Property 5: imported + skipped + errors always equals total", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(gameArb, { maxLength: 30 }),
        fc.boolean(),
        async (specs, notableOnly) => {
          mocks.importGameFromIGDB.mockClear();
          serveFromApi(buildGames(specs));
          scriptImporter(specs.map((s) => s.outcome));

          const stats = await new ImportOrchestrator(options({ notableOnly })).run();

          const processed = specs.filter((s) => !notableOnly || s.notable);
          expect(stats.total).toBe(specs.length);
          expect(stats.imported + stats.skipped + stats.errors).toBe(stats.total);
          expect(stats.skipped).toBe(specs.length - processed.length);
          expect(stats.imported).toBe(
            processed.filter((s) => s.outcome === "imported" || s.outcome === "synced").length
          );
          expect(stats.errors).toBe(
            processed.filter((s) => s.outcome === "failed" || s.outcome === "thrown").length
          );
        }
      ),
      { numRuns: 60 }
    );
  });

  it("Property 6: API dry-run never calls the importer and imports nothing", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(gameArb, { maxLength: 30 }), async (specs) => {
        mocks.importGameFromIGDB.mockClear();
        serveFromApi(buildGames(specs));

        const stats = await new ImportOrchestrator(options({ dryRun: true })).run();

        expect(mocks.importGameFromIGDB).not.toHaveBeenCalled();
        expect(stats.imported).toBe(0);
        expect(stats.errors).toBe(0);
        expect(stats.skipped).toBe(specs.length);
      }),
      { numRuns: 40 }
    );
  });

  it("Property 6 (dump): dry-run neither writes the SQL file nor reports imports", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(gameArb, { maxLength: 30 }), async (specs) => {
        mocks.generateGamesSql.mockClear();
        mocks.assembleGamesFromDumps.mockResolvedValue(buildGames(specs));

        const stats = await new ImportOrchestrator(options({ source: "dump", dryRun: true })).run();

        expect(mocks.generateGamesSql).not.toHaveBeenCalled();
        expect(stats.imported).toBe(0);
        expect(stats.skipped).toBe(specs.length);
        expect(stats.total).toBe(specs.length);
      }),
      { numRuns: 30 }
    );
  });

  it("Properties 7 & 8: limit caps processed games and offset is passed to IGDB", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 40 }),
        fc.integer({ min: 1, max: 25 }),
        fc.integer({ min: 0, max: 45 }),
        async (count, limit, offset) => {
          mocks.importGameFromIGDB.mockClear().mockResolvedValue({ success: true });
          mocks.fetchGamesBatch.mockClear();
          const games = buildGames(Array.from({ length: count }, () => ({ notable: true })));
          serveFromApi(games);

          const stats = await new ImportOrchestrator(options({ limit, offset })).run();

          const expected = games.slice(offset, offset + limit);
          expect(stats.total).toBe(expected.length);
          expect(stats.total).toBeLessThanOrEqual(limit);
          expect(mocks.importGameFromIGDB.mock.calls.map(([g]) => g.id)).toEqual(
            expected.map((g) => g.id)
          );
          const offsets = mocks.fetchGamesBatch.mock.calls.map((call) => call[2]);
          expect(offsets[0]).toBe(offset);
          for (const [, , , batchSize] of mocks.fetchGamesBatch.mock.calls) {
            expect(batchSize).toBeLessThanOrEqual(TEST_BATCH_SIZE);
          }
        }
      ),
      { numRuns: 60 }
    );
  });

  it("dump mode filters by release date, then applies offset and limit before writing SQL", async () => {
    const inRange = buildGames(Array.from({ length: 10 }, () => ({ notable: true })));
    const outOfRange = { id: 99, name: "Old", first_release_date: 0 } as unknown as IGDBGame;
    const undated = { id: 100, name: "Undated" } as unknown as IGDBGame;
    mocks.assembleGamesFromDumps.mockResolvedValue([outOfRange, ...inRange, undated]);

    const stats = await new ImportOrchestrator(
      options({ source: "dump", offset: 2, limit: 3 })
    ).run();

    const written = mocks.generateGamesSql.mock.calls[0][0] as IGDBGame[];
    expect(written.map((g) => g.id)).toEqual([3, 4, 5]);
    expect(stats).toMatchObject({ total: 3, imported: 3 });
  });

  it("dump mode aborts when the games dump could not be downloaded", async () => {
    mocks.downloadGameDumps.mockResolvedValue(new Map());
    await expect(new ImportOrchestrator(options({ source: "dump" })).run()).rejects.toThrow(
      /games dump/
    );
  });
});
