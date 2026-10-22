/**
 * Weekly refresh of IGDB popularity (PopScore) and trending scores.
 *
 * 1. Takes IGDB's current top games for Visits / Want to Play / Playing.
 * 2. Refreshes the primitives of those games when they are in the catalogue,
 *    plus a rotating batch of the stalest catalogue games.
 * 3. Imports a few top games missing from the catalogue (adult games skipped).
 * 4. Recomputes hybrid + trending scores for every game (the age decay moves over time).
 *
 * Runs with the service role (cron). IGDB allows ~4 req/s: calls are spaced.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import { GameImportService } from "@/lib/services/gameImportService";
import { IGDBService } from "@/lib/services/igdbService";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any>;

const POPULARITY_TYPES = [1, 2, 3] as const;
const TOP_PER_TYPE = 500;
/** 3 primitives per game, IGDB returns at most 500 rows per call. */
const PRIMITIVES_CHUNK = 150;
const STALE_BATCH = 1500;
const MAX_IMPORTS_PER_RUN = 5;
/** Missing games are looked for among the top N of each type. */
const IMPORT_CANDIDATES_PER_TYPE = 100;
const IGDB_SPACING_MS = 300;

export interface PopularityRefreshReport {
  topGames: number;
  refreshed: number;
  imported: number;
  importFailures: number;
  rescored: number;
}

let spacingMs = IGDB_SPACING_MS;
const pause = () => new Promise((resolve) => setTimeout(resolve, spacingMs));

/** Union of the top ids, interleaved by rank so the best of each type come first. */
export function mergeRankedIds(lists: number[][]): number[] {
  const merged: number[] = [];
  const seen = new Set<number>();
  const longest = Math.max(0, ...lists.map((list) => list.length));
  for (let rank = 0; rank < longest; rank++) {
    for (const list of lists) {
      const id = list[rank];
      if (id !== undefined && !seen.has(id)) {
        seen.add(id);
        merged.push(id);
      }
    }
  }
  return merged;
}

async function fetchTopIds(): Promise<number[][]> {
  const lists: number[][] = [];
  for (const type of POPULARITY_TYPES) {
    lists.push(await IGDBService.getTopPopularityGameIds(type, TOP_PER_TYPE));
    await pause();
  }
  return lists;
}

async function findLocalIgdbIds(admin: AdminClient, igdbIds: number[]): Promise<Set<number>> {
  const local = new Set<number>();
  for (let i = 0; i < igdbIds.length; i += 500) {
    const { data, error } = await admin
      .from("games")
      .select("igdb_id")
      .in("igdb_id", igdbIds.slice(i, i + 500));
    if (error) throw new Error(`games lookup failed: ${error.message}`);
    for (const row of data ?? []) local.add(row.igdb_id as number);
  }
  return local;
}

async function fetchStaleIgdbIds(admin: AdminClient, exclude: Set<number>): Promise<number[]> {
  const { data, error } = await admin
    .from("games")
    .select("igdb_id")
    .not("igdb_id", "is", null)
    .order("igdb_pop_updated_at", { ascending: true, nullsFirst: true })
    .limit(STALE_BATCH + exclude.size);
  if (error) throw new Error(`stale games lookup failed: ${error.message}`);
  return (data ?? [])
    .map((row) => row.igdb_id as number)
    .filter((id) => !exclude.has(id))
    .slice(0, STALE_BATCH);
}

async function refreshPrimitives(admin: AdminClient, igdbIds: number[]): Promise<number> {
  let refreshed = 0;
  for (let i = 0; i < igdbIds.length; i += PRIMITIVES_CHUNK) {
    const chunk = igdbIds.slice(i, i + PRIMITIVES_CHUNK);
    const primitives = await IGDBService.getPopularityBatch(chunk);
    await pause();
    // Games without any primitive get nulls: their IGDB part drops to 0, as it should.
    const rows = chunk.map((igdbId) => {
      const values = primitives.get(igdbId);
      return {
        igdb_id: igdbId,
        visits: values?.visits ?? null,
        want: values?.wantToPlay ?? null,
        playing: values?.playing ?? null,
      };
    });
    const { data, error } = await admin.rpc("apply_igdb_popularity", { p_rows: rows });
    if (error) throw new Error(`apply_igdb_popularity failed: ${error.message}`);
    refreshed += (data as number | null) ?? 0;
  }
  return refreshed;
}

async function importMissing(
  lists: number[][],
  local: Set<number>
): Promise<{ imported: number; failures: number }> {
  const candidates = mergeRankedIds(
    lists.map((list) => list.slice(0, IMPORT_CANDIDATES_PER_TYPE))
  ).filter((id) => !local.has(id));
  if (candidates.length === 0) return { imported: 0, failures: 0 };

  const importable = (await IGDBService.filterImportableGameIds(candidates)).slice(
    0,
    MAX_IMPORTS_PER_RUN
  );
  let imported = 0;
  let failures = 0;
  for (const igdbId of importable) {
    await pause();
    const result = await GameImportService.importFromIGDB(igdbId);
    if (result.success) imported++;
    else {
      failures++;
      logger.warn("Popularity refresh import failed", { igdbId, error: result.error });
    }
  }
  return { imported, failures };
}

export async function refreshPopularity(
  admin: AdminClient,
  options: { igdbSpacingMs?: number } = {}
): Promise<PopularityRefreshReport> {
  spacingMs = options.igdbSpacingMs ?? IGDB_SPACING_MS;
  const lists = await fetchTopIds();
  const topIds = mergeRankedIds(lists);
  const local = await findLocalIgdbIds(admin, topIds);
  const localTop = topIds.filter((id) => local.has(id));
  const stale = await fetchStaleIgdbIds(admin, new Set(localTop));

  const refreshed = await refreshPrimitives(admin, [...localTop, ...stale]);
  const { imported, failures } = await importMissing(lists, local);

  const { data: rescored, error } = await admin.rpc("refresh_trending_scores");
  if (error) throw new Error(`refresh_trending_scores failed: ${error.message}`);

  return {
    topGames: topIds.length,
    refreshed,
    imported,
    importFailures: failures,
    rescored: (rescored as number | null) ?? 0,
  };
}
