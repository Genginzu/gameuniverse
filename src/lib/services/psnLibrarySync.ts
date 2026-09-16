import type { SupabaseClient } from "@supabase/supabase-js";
import { getRecentlyPlayedGames } from "psn-api";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { EXTERNAL_GAME_CATEGORY, resolveIgdbIdsByExternalUids } from "./igdb-external-games";
import { GameImportService } from "./gameImportService";
import { IGDBService } from "./igdbService";
import { getValidAccessToken } from "./platformTokenRefresh";
import type { LibrarySyncProgressCallback } from "@/types/library-sync";

const UPSERT_CHUNK = 200;
/** How many played games to request from PSN in one call. */
const PSN_FETCH_LIMIT = 200;
/**
 * Combined budget (per run) for expensive IGDB operations: importing a missing
 * game and running a name-search fallback. Keeps us within IGDB's rate limit
 * (4 req/s) and the function time budget; the rest is picked up next run.
 */
const MAX_IGDB_OPS_PER_SYNC = 30;

export interface PsnSyncResult {
  total: number;
  matched: number;
  upserted: number;
  unmatched: number;
  imported: number;
}

interface PsnGame {
  name: string;
  titleId: string;
  conceptId: string;
  productId: string | null;
}

/**
 * Normalize a game title for strict cross-source comparison: lower-case, strip
 * trademark symbols, collapse whitespace, and drop common edition/platform
 * suffixes. Used to guard the fuzzy IGDB name-search fallback against false
 * positives.
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[™®©]/g, "")
    .replace(/[:\-–—]/g, " ")
    .replace(
      /\b(ps4|ps5|playstation( ?[45])?|deluxe|standard|digital|edition|remastered|goty|game of the year|complete)\b/g,
      " "
    )
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPsnLibrary(accessToken: string): Promise<PsnGame[]> {
  const response = await getRecentlyPlayedGames(
    { accessToken },
    { limit: PSN_FETCH_LIMIT, categories: ["ps4_game", "ps5_native_game"] }
  );
  const games = response.data?.gameLibraryTitlesRetrieve?.games ?? [];
  return games.map((g) => ({
    name: g.name,
    titleId: g.titleId,
    conceptId: g.conceptId,
    productId: g.productId,
  }));
}

/** Map already-local games by their igdb_id. */
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

/** Import a game from IGDB and return the new local game id (or null). */
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
    logger.error("IGDB import threw during PSN sync", { igdbId, err });
    return null;
  }
}

export async function syncPsnLibrary(
  supabase: SupabaseClient<Database>,
  playerId: string,
  onProgress?: LibrarySyncProgressCallback
): Promise<PsnSyncResult> {
  onProgress?.({ phase: "fetching" });

  const accessToken = await getValidAccessToken(supabase, playerId, "playstation");
  if (!accessToken) {
    throw new Error("PlayStation account not connected or token refresh failed");
  }

  const games = await fetchPsnLibrary(accessToken);
  if (games.length === 0) {
    onProgress?.({ phase: "done", total: 0, processed: 0, matched: 0 });
    return { total: 0, matched: 0, upserted: 0, unmatched: 0, imported: 0 };
  }

  onProgress?.({ phase: "resolving", total: games.length });

  // ── 1. Primary mapping: IGDB external_games, PlayStation Store source (36).
  //    PSN exposes several store identifiers; try each as a candidate uid.
  const uidToGame = new Map<string, PsnGame>();
  for (const g of games) {
    for (const uid of [g.conceptId, g.productId, g.titleId]) {
      if (uid) uidToGame.set(String(uid), g);
    }
  }
  const uidToIgdb = await resolveIgdbIdsByExternalUids(
    Array.from(uidToGame.keys()),
    EXTERNAL_GAME_CATEGORY.PLAYSTATION_STORE_US
  );

  // titleId → resolved igdb id (dedupe per game via titleId as the stable key).
  const gameIgdbId = new Map<string, number>();
  for (const [uid, igdbId] of uidToIgdb.entries()) {
    const g = uidToGame.get(uid);
    if (g && !gameIgdbId.has(g.titleId)) gameIgdbId.set(g.titleId, igdbId);
  }

  const resolvedGameId = new Map<string, string>(); // titleId → local game id
  let igdbOps = 0;
  let imported = 0;

  // Resolve cat-36 igdb ids to local games, importing missing ones on budget.
  const igdbIds = Array.from(new Set(gameIgdbId.values()));
  const localByIgdb = await fetchLocalGameIdsByIgdb(supabase, igdbIds);
  for (const [titleId, igdbId] of gameIgdbId.entries()) {
    const local = localByIgdb.get(igdbId);
    if (local) {
      resolvedGameId.set(titleId, local);
    } else if (igdbOps < MAX_IGDB_OPS_PER_SYNC) {
      igdbOps += 1;
      onProgress?.({ phase: "importing", imported, currentItem: nameOf(games, titleId) });
      const newId = await importIgdbGame(supabase, igdbId);
      if (newId) {
        resolvedGameId.set(titleId, newId);
        imported += 1;
        onProgress?.({ phase: "importing", imported });
      }
    }
  }

  // ── 2. Fallback: IGDB name search for still-unmatched games (strict match).
  for (const g of games) {
    if (igdbOps >= MAX_IGDB_OPS_PER_SYNC) break;
    if (resolvedGameId.has(g.titleId)) continue;
    igdbOps += 1;
    try {
      const results = await IGDBService.searchGames(g.name, 5);
      const target = normalizeTitle(g.name);
      const hit = results.find((r) => r.name && normalizeTitle(r.name) === target);
      if (!hit?.id) continue;

      const local = (await fetchLocalGameIdsByIgdb(supabase, [hit.id])).get(hit.id);
      if (local) {
        resolvedGameId.set(g.titleId, local);
      } else if (imported < MAX_IGDB_OPS_PER_SYNC) {
        onProgress?.({ phase: "importing", imported, currentItem: g.name });
        const newId = await importIgdbGame(supabase, hit.id);
        if (newId) {
          resolvedGameId.set(g.titleId, newId);
          imported += 1;
          onProgress?.({ phase: "importing", imported });
        }
      }
    } catch (err) {
      logger.warn("PSN name-search fallback failed", { name: g.name, err });
    }
  }

  // ── 3. Upsert resolved games into the user library.
  const now = new Date().toISOString();
  const rows = games
    .map((g) => {
      const gameId = resolvedGameId.get(g.titleId);
      if (!gameId) return null;
      return {
        user_id: playerId,
        game_id: gameId,
        status: "owned",
        source_platform: "playstation",
        source_id: g.titleId,
        synced_at: now,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  onProgress?.({ phase: "saving", total: games.length, matched: rows.length, imported });

  let upserted = 0;
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error, count } = await supabase
      .from("user_library")
      .upsert(chunk, { onConflict: "user_id,game_id", count: "exact" });
    if (error) {
      logger.error("Failed to upsert PSN user_library chunk", { error, chunkSize: chunk.length });
      throw error;
    }
    upserted += count ?? chunk.length;
    onProgress?.({ processed: upserted });
  }

  onProgress?.({
    phase: "done",
    total: games.length,
    processed: upserted,
    matched: rows.length,
    imported,
    unmatched: games.length - rows.length,
  });

  return {
    total: games.length,
    matched: rows.length,
    upserted,
    unmatched: games.length - rows.length,
    imported,
  };
}

function nameOf(games: PsnGame[], titleId: string): string | undefined {
  return games.find((g) => g.titleId === titleId)?.name;
}
