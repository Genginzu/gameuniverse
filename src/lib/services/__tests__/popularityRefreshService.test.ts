import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const igdb = vi.hoisted(() => ({
  getTopPopularityGameIds: vi.fn(),
  getPopularityBatch: vi.fn(),
  filterImportableGameIds: vi.fn(),
}));
const importer = vi.hoisted(() => ({ importFromIGDB: vi.fn() }));

vi.mock("@/lib/services/igdbService", () => ({ IGDBService: igdb }));
vi.mock("@/lib/services/gameImportService", () => ({ GameImportService: importer }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { mergeRankedIds, refreshPopularity } =
  await import("@/lib/services/popularityRefreshService");

const mock = createSupabaseQueryMock();
const rpc = vi.fn();
const client = { ...mock.client, rpc } as unknown as SupabaseClient;

beforeEach(() => {
  vi.resetAllMocks();
  mock.reset();
});

describe("mergeRankedIds", () => {
  it("interleaves lists by rank and removes duplicates", () => {
    expect(mergeRankedIds([[1, 2, 3], [2, 4], [5]])).toEqual([1, 2, 5, 4, 3]);
  });
});

describe("refreshPopularity", () => {
  it("refreshes top + stale games, imports missing ones and rescores", async () => {
    igdb.getTopPopularityGameIds
      .mockResolvedValueOnce([10, 20])
      .mockResolvedValueOnce([30])
      .mockResolvedValueOnce([]);
    mock.enqueue(
      "games",
      { data: [{ igdb_id: 10 }] },
      { data: [{ igdb_id: 10 }, { igdb_id: 99 }] }
    );
    igdb.getPopularityBatch.mockResolvedValue(
      new Map([[10, { visits: 0.001, wantToPlay: 0.002, playing: null }]])
    );
    igdb.filterImportableGameIds.mockResolvedValue([30]);
    importer.importFromIGDB.mockResolvedValue({ success: true });
    rpc
      .mockResolvedValueOnce({ data: 2, error: null })
      .mockResolvedValueOnce({ data: 7, error: null });

    const report = await refreshPopularity(client, { igdbSpacingMs: 0 });

    expect(igdb.getPopularityBatch).toHaveBeenCalledWith([10, 99]);
    expect(rpc).toHaveBeenNthCalledWith(1, "apply_igdb_popularity", {
      p_rows: [
        { igdb_id: 10, visits: 0.001, want: 0.002, playing: null },
        { igdb_id: 99, visits: null, want: null, playing: null },
      ],
    });
    expect(igdb.filterImportableGameIds).toHaveBeenCalledWith([30, 20]);
    expect(importer.importFromIGDB).toHaveBeenCalledWith(30);
    expect(rpc).toHaveBeenNthCalledWith(2, "refresh_trending_scores");
    expect(report).toEqual({
      topGames: 3,
      refreshed: 2,
      imported: 1,
      importFailures: 0,
      rescored: 7,
    });
  });

  it("fails when the rescoring RPC fails", async () => {
    igdb.getTopPopularityGameIds.mockResolvedValue([]);
    mock.enqueue("games", { data: [] });
    igdb.filterImportableGameIds.mockResolvedValue([]);
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    await expect(refreshPopularity(client, { igdbSpacingMs: 0 })).rejects.toThrow(
      "refresh_trending_scores failed"
    );
  });
});
