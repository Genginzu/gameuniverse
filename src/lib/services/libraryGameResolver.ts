import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { resolveIgdbIdsByExternalUids, type ExternalGameCategory } from "./igdb-external-games";
import { GameImportService } from "./gameImportService";
import { IGDBService } from "./igdbService";
import { backfillMatch } from "./librarySyncBackfill";
import type { LibrarySyncProgressCallback } from "@/types/library-sync";

const MATCH_CACHE_TABLE = "platform_game_matches";

/** One item from a connected platform's library to resolve to a local game. */
export interface ResolvableLibraryItem {
  /** Stable per-item key (e.g. Xbox titleId, PSN titleId) used in the result map. */
  sourceId: string;
  /** Display name, used for the IGDB name-search fallback. */
  name: string;
  /** Candidate external ids to try against IGDB external_games (store ids, etc.). */
  uids: string[];
}

export interface ResolveResult {
  /** sourceId → local game id (includes cached hits + newly resolved this pass). */
  resolved: Map<string, string>;
  /** Number of games imported from IGDB during this pass. */
  imported: number;
  /** Uncached candidates left unattempted (budget exhausted) — more to do if > 0. */
  pending: number;
}

interface ResolveOptions {
  platform: string;
  /** Max expensive IGDB operations (imports + name searches) per pass. */
  importBudget: number;
  onProgress?: LibrarySyncProgressCallback;
}

/**
 * Collapse library rows that target the same local game (e.g. multiple store
 * ids / editions resolving to one IGDB game). Prevents a single upsert command
 * from touching the same (user_id, game_id) row twice, which Postgres rejects
 * with "ON CONFLICT DO UPDATE command cannot affect row a second time".
 */
export function dedupeByGameId<T extends { game_id: string }>(
  rows: T[],
  pick: (existing: T, candidate: T) => T = (existing) => existing
): T[] {
  const byGame = new Map<string, T>();
  for (const row of rows) {
    const existing = byGame.get(row.game_id);
    byGame.set(row.game_id, existing ? pick(existing, row) : row);
  }
  return Array.from(byGame.values());
}

/**
 * Normalize a game title for strict cross-source comparison: lower-case, strip
 * trademark symbols, collapse whitespace, and drop common edition/platform
 * suffixes. Guards the fuzzy IGDB name-search fallback against false positives.
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[™®©]/g, "")
    .replace(/[:\-–—]/g, " ")
    .replace(
      /\b(ps4|ps5|playstation( ?[45])?|xbox( ?(one|series( ?[sx])?))?|deluxe|standard|digital|edition|remastered|goty|game of the year|complete)\b/g,
      " "
    )
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchLocalGameIdsByIgdb(
  supabase: SupabaseClient<Database>,
  igdbIds: number[]
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (igdbIds.length === 0) return map;
  const { data, error } = await supabase
    .from("games")
    .select("id, igdb_id")
    .in("igdb_id", Array.from(new Set(igdbIds)));
  if (error) throw error;
  for (const row of data ?? []) {
    if (row.igdb_id !== null) map.set(row.igdb_id, row.id);
  }
  return map;
}

async function importIgdbGame(
  supabase: SupabaseClient<Database>,
  igdbId: number
): Promise<string | null> {
  try {
    const result = await GameImportService.importFromIGDB(igdbId);
    if (!result.success) return null;
    const { data } = await supabase
      .from("games")
      .select("id")
      .eq("igdb_id", igdbId)
      .maybeSingle();
    return data?.id ?? null;
  } catch (err) {
    logger.error("IGDB import threw during library resolution", { igdbId, err });
    return null;
  }
}

/** Load the cached source_id → game_id resolutions for this platform. */
async function loadMatchCache(
  supabase: SupabaseClient,
  platform: string,
  sourceIds: string[]
): Promise<Map<string, string | null>> {
  const cache = new Map<string, string | null>();
  if (sourceIds.length === 0) return cache;
  const { data, error } = await supabase
    .from(MATCH_CACHE_TABLE)
    .select("source_id, game_id")
    .eq("platform", platform)
    .in("source_id", sourceIds);
  if (error) {
    // Missing table / not migrated yet: behave as an empty cache (no crash).
    logger.warn("Match cache unavailable; resolving without it", { platform, error });
    return cache;
  }
  for (const row of (data ?? []) as Array<{ source_id: string; game_id: string | null }>) {
    cache.set(row.source_id, row.game_id ?? null);
  }
  return cache;
}

/** Persist attempted resolutions (hits and misses) so future passes skip them. */
async function writeMatchCache(
  supabase: SupabaseClient,
  platform: string,
  entries: Array<{ sourceId: string; gameId: string | null; name: string }>
): Promise<void> {
  if (entries.length === 0) return;
  const now = new Date().toISOString();
  const rows = entries.map((e) => ({
    platform,
    source_id: e.sourceId,
    game_id: e.gameId,
    name: e.name,
    updated_at: now,
  }));
  const { error } = await supabase
    .from(MATCH_CACHE_TABLE)
    .upsert(rows, { onConflict: "platform,source_id" });
  if (error) logger.error("Failed to write match cache", { platform, error });
}

/**
 * Resolve platform library items to local game ids, caching every attempt so
 * multi-pass syncs advance through the backlog instead of re-attempting the
 * same titles. Per pass:
 *   1. Reuse cached hits for free.
 *   2. For uncached titles: map via IGDB external_games, then fall back to a
 *      strict IGDB name search — importing missing games — up to `importBudget`
 *      IGDB operations. Every attempt (hit or miss) is written to the cache.
 *
 * Shared by the Xbox and PlayStation sync services.
 */
export async function resolveLibraryGames(
  supabase: SupabaseClient<Database>,
  items: ResolvableLibraryItem[],
  category: ExternalGameCategory,
  { platform, importBudget, onProgress }: ResolveOptions
): Promise<ResolveResult> {
  const resolved = new Map<string, string>();
  if (items.length === 0) return { resolved, imported: 0, pending: 0 };

  // ── 0. Reuse cached resolutions (shared across users).
  const cache = await loadMatchCache(
    supabase,
    platform,
    items.map((i) => i.sourceId)
  );
  for (const item of items) {
    if (cache.has(item.sourceId)) {
      const cached = cache.get(item.sourceId);
      if (cached) resolved.set(item.sourceId, cached);
    }
  }
  const candidates = items.filter((i) => !cache.has(i.sourceId));
  if (candidates.length === 0) return { resolved, imported: 0, pending: 0 };

  // ── 1. external_games mapping for uncached candidates.
  const uidToSourceId = new Map<string, string>();
  for (const item of candidates) {
    for (const uid of item.uids) {
      if (uid && !uidToSourceId.has(String(uid))) uidToSourceId.set(String(uid), item.sourceId);
    }
  }
  const uidToIgdb = await resolveIgdbIdsByExternalUids(Array.from(uidToSourceId.keys()), category);
  const candidateIgdb = new Map<string, number>();
  for (const [uid, igdbId] of uidToIgdb.entries()) {
    const sourceId = uidToSourceId.get(uid);
    if (sourceId && !candidateIgdb.has(sourceId)) candidateIgdb.set(sourceId, igdbId);
  }

  const attempts: Array<{ sourceId: string; gameId: string | null; name: string }> = [];

  // Free: candidates whose IGDB id is already a local game.
  const igdbIds = Array.from(new Set(candidateIgdb.values()));
  const localByIgdb = await fetchLocalGameIdsByIgdb(supabase, igdbIds);
  const needsWork: ResolvableLibraryItem[] = [];
  for (const item of candidates) {
    const igdb = candidateIgdb.get(item.sourceId);
    const local = igdb !== undefined ? localByIgdb.get(igdb) : undefined;
    if (local) {
      resolved.set(item.sourceId, local);
      attempts.push({ sourceId: item.sourceId, gameId: local, name: item.name });
    } else {
      needsWork.push(item);
    }
  }

  // ── 2. Budgeted IGDB work: import (cat hit, no local) or name search.
  let imported = 0;
  let processed = 0;
  for (const item of needsWork) {
    if (processed >= importBudget) break;
    processed += 1;
    let gameId: string | null = null;

    const igdb = candidateIgdb.get(item.sourceId);
    if (igdb !== undefined) {
      onProgress?.({ phase: "importing", imported, currentItem: item.name });
      gameId = await importIgdbGame(supabase, igdb);
      if (gameId) imported += 1;
    } else {
      try {
        const results = await IGDBService.searchGames(item.name, 5);
        const target = normalizeTitle(item.name);
        const hit = results.find((r) => r.name && normalizeTitle(r.name) === target);
        if (hit?.id) {
          const local = (await fetchLocalGameIdsByIgdb(supabase, [hit.id])).get(hit.id);
          if (local) {
            gameId = local;
          } else {
            onProgress?.({ phase: "importing", imported, currentItem: item.name });
            gameId = await importIgdbGame(supabase, hit.id);
            if (gameId) imported += 1;
          }
        }
      } catch (err) {
        logger.warn("Library name-search fallback failed", { name: item.name, err });
        // Don't cache a miss on transient errors — retry next pass.
        processed -= 1;
        continue;
      }
    }

    if (gameId) resolved.set(item.sourceId, gameId);
    attempts.push({ sourceId: item.sourceId, gameId, name: item.name });
  }

  await writeMatchCache(supabase, platform, attempts);

  // Backfill each freshly-discovered match into the libraries of other users
  // who already reported this title (best-effort, so a slow/failed backfill
  // never breaks the sync).
  const admin = supabase as unknown as SupabaseClient;
  await Promise.all(
    attempts
      .filter((a) => a.gameId)
      .map((a) => backfillMatch(admin, platform, a.sourceId, a.gameId as string))
  );

  // Candidates that still need work but weren't processed this pass.
  const pending = Math.max(0, needsWork.length - processed);
  return { resolved, imported, pending };
}
