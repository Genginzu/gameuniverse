import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { resolveIgdbIdsByExternalUids, type ExternalGameCategory } from "./igdb-external-games";
import { GameImportService } from "./gameImportService";
import { IGDBService } from "./igdbService";
import type { LibrarySyncProgressCallback } from "@/types/library-sync";

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
  /** sourceId → local game id. */
  resolved: Map<string, string>;
  /** Number of games imported from IGDB during this resolution. */
  imported: number;
}

/**
 * Collapse library rows that target the same local game (e.g. multiple store
 * ids / editions resolving to one IGDB game). Prevents a single upsert command
 * from touching the same (user_id, game_id) row twice, which Postgres rejects
 * with "ON CONFLICT DO UPDATE command cannot affect row a second time".
 *
 * `pick(existing, candidate)` decides which row to keep on collision
 * (defaults to keeping the first seen).
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

interface ResolveOptions {
  /** Max expensive IGDB operations (imports + name searches) per run. */
  importBudget: number;
  onProgress?: LibrarySyncProgressCallback;
}

/**
 * Resolve platform library items to local game ids in two stages:
 *   1. IGDB `external_games` mapping via the given source (Steam/Xbox/PSN store
 *      ids), importing missing games on a budget.
 *   2. Fallback IGDB name search with strict normalized-title equality, again
 *      importing missing games (shared budget) — this covers platforms whose
 *      store ids don't line up with IGDB's external ids (notably Xbox/PSN).
 *
 * Shared by the Xbox and PlayStation sync services.
 */
export async function resolveLibraryGames(
  supabase: SupabaseClient<Database>,
  items: ResolvableLibraryItem[],
  category: ExternalGameCategory,
  { importBudget, onProgress }: ResolveOptions
): Promise<ResolveResult> {
  const resolved = new Map<string, string>();
  if (items.length === 0) return { resolved, imported: 0 };

  const nameOf = (sourceId: string) => items.find((i) => i.sourceId === sourceId)?.name;

  // ── 1. external_games mapping.
  const uidToSourceId = new Map<string, string>();
  for (const item of items) {
    for (const uid of item.uids) {
      if (uid && !uidToSourceId.has(String(uid))) uidToSourceId.set(String(uid), item.sourceId);
    }
  }
  const uidToIgdb = await resolveIgdbIdsByExternalUids(Array.from(uidToSourceId.keys()), category);

  const sourceIgdbId = new Map<string, number>();
  for (const [uid, igdbId] of uidToIgdb.entries()) {
    const sourceId = uidToSourceId.get(uid);
    if (sourceId && !sourceIgdbId.has(sourceId)) sourceIgdbId.set(sourceId, igdbId);
  }

  let igdbOps = 0;
  let imported = 0;

  const igdbIds = Array.from(new Set(sourceIgdbId.values()));
  const localByIgdb = await fetchLocalGameIdsByIgdb(supabase, igdbIds);
  for (const [sourceId, igdbId] of sourceIgdbId.entries()) {
    const local = localByIgdb.get(igdbId);
    if (local) {
      resolved.set(sourceId, local);
    } else if (igdbOps < importBudget) {
      igdbOps += 1;
      onProgress?.({ phase: "importing", imported, currentItem: nameOf(sourceId) });
      const newId = await importIgdbGame(supabase, igdbId);
      if (newId) {
        resolved.set(sourceId, newId);
        imported += 1;
        onProgress?.({ phase: "importing", imported });
      }
    }
  }

  // ── 2. Name-search fallback for still-unmatched items.
  for (const item of items) {
    if (igdbOps >= importBudget) break;
    if (resolved.has(item.sourceId)) continue;
    igdbOps += 1;
    try {
      const results = await IGDBService.searchGames(item.name, 5);
      const target = normalizeTitle(item.name);
      const hit = results.find((r) => r.name && normalizeTitle(r.name) === target);
      if (!hit?.id) continue;

      const local = (await fetchLocalGameIdsByIgdb(supabase, [hit.id])).get(hit.id);
      if (local) {
        resolved.set(item.sourceId, local);
      } else {
        onProgress?.({ phase: "importing", imported, currentItem: item.name });
        const newId = await importIgdbGame(supabase, hit.id);
        if (newId) {
          resolved.set(item.sourceId, newId);
          imported += 1;
          onProgress?.({ phase: "importing", imported });
        }
      }
    } catch (err) {
      logger.warn("Library name-search fallback failed", { name: item.name, err });
    }
  }

  return { resolved, imported };
}
