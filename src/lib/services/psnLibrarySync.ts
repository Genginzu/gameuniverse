import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserTitles } from "psn-api";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { EXTERNAL_GAME_CATEGORY } from "./igdb-external-games";
import { resolveLibraryGames, dedupeByGameId, type ResolvableLibraryItem } from "./libraryGameResolver";
import { recordUserPlatformTitles } from "./librarySyncBackfill";
import { getValidAccessToken } from "./platformTokenRefresh";
import type { LibrarySyncProgressCallback } from "@/types/library-sync";

const UPSERT_CHUNK = 200;
/** Trophy titles fetched per PSN page (nextOffset paginates the rest). */
const PSN_PAGE_LIMIT = 100;
/** Safety cap on total PSN titles fetched per sync. */
const PSN_MAX_TITLES = 800;
/** Cap on IGDB imports/searches per run (rate-limit + function-time budget). */
const MAX_IGDB_OPS_PER_SYNC = 30;

export interface PsnSyncResult {
  total: number;
  matched: number;
  upserted: number;
  unmatched: number;
  imported: number;
  /** True when every title has been attempted (no more work to do). */
  done: boolean;
}

interface PsnGame {
  /** npCommunicationId — stable per trophy set, used as the source id. */
  sourceId: string;
  name: string;
}

/**
 * Fetch the user's full played-games list via the paginated trophy-titles API
 * (getUserTitles). Unlike getRecentlyPlayedGames (≤50, no paging), this covers
 * the whole library. Titles are matched by name (no reliable store id here).
 */
async function fetchPsnLibrary(accessToken: string, accountId: string): Promise<PsnGame[]> {
  const games: PsnGame[] = [];
  let offset = 0;

  while (games.length < PSN_MAX_TITLES) {
    const resp = await getUserTitles({ accessToken }, accountId, {
      limit: PSN_PAGE_LIMIT,
      offset,
    });
    const titles = resp.trophyTitles ?? [];
    for (const t of titles) {
      games.push({ sourceId: t.npCommunicationId, name: t.trophyTitleName });
    }
    if (titles.length === 0 || resp.nextOffset === undefined || resp.nextOffset <= offset) break;
    offset = resp.nextOffset;
  }

  return games;
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

  const { data: linked } = await supabase
    .from("player_linked_platforms")
    .select("external_id")
    .eq("player_id", playerId)
    .eq("platform", "playstation")
    .maybeSingle();
  const accountId = linked?.external_id;
  if (!accountId) {
    throw new Error("PlayStation account id missing — reconnect the account");
  }

  const games = await fetchPsnLibrary(accessToken, accountId);
  if (games.length === 0) {
    onProgress?.({ phase: "done", total: 0, processed: 0, matched: 0 });
    return { total: 0, matched: 0, upserted: 0, unmatched: 0, imported: 0, done: true };
  }

  onProgress?.({ phase: "resolving", total: games.length });

  await recordUserPlatformTitles(
    supabase as unknown as SupabaseClient,
    playerId,
    "playstation",
    games.map((g) => ({ sourceId: g.sourceId, name: g.name }))
  );

  // No reliable PSN store id from trophy titles, so the resolver matches by
  // name (the shared cache makes multi-pass progress and avoids re-searching).
  const items: ResolvableLibraryItem[] = games.map((g) => ({
    sourceId: g.sourceId,
    name: g.name,
    uids: [],
  }));

  const { resolved, imported, pending } = await resolveLibraryGames(
    supabase,
    items,
    EXTERNAL_GAME_CATEGORY.PLAYSTATION_STORE_US,
    { platform: "playstation", importBudget: MAX_IGDB_OPS_PER_SYNC, onProgress }
  );

  const now = new Date().toISOString();
  const rows = games
    .map((g) => {
      const gameId = resolved.get(g.sourceId);
      if (!gameId) return null;
      return {
        user_id: playerId,
        game_id: gameId,
        status: "owned",
        source_platform: "playstation",
        source_id: g.sourceId,
        synced_at: now,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  onProgress?.({ phase: "saving", total: games.length, matched: rows.length, imported });

  // Different trophy sets can resolve to the same local game — collapse them.
  const dedupedRows = dedupeByGameId(rows);

  let upserted = 0;
  for (let i = 0; i < dedupedRows.length; i += UPSERT_CHUNK) {
    const chunk = dedupedRows.slice(i, i + UPSERT_CHUNK);
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
    done: pending === 0,
  };
}
