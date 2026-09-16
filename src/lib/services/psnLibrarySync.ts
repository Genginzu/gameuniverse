import type { SupabaseClient } from "@supabase/supabase-js";
import { getRecentlyPlayedGames } from "psn-api";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { EXTERNAL_GAME_CATEGORY } from "./igdb-external-games";
import { resolveLibraryGames, dedupeByGameId, type ResolvableLibraryItem } from "./libraryGameResolver";
import { recordUserPlatformTitles } from "./librarySyncBackfill";
import { getValidAccessToken } from "./platformTokenRefresh";
import type { LibrarySyncProgressCallback } from "@/types/library-sync";

const UPSERT_CHUNK = 200;
/** How many played games to request from PSN in one call. */
const PSN_FETCH_LIMIT = 200;
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
  name: string;
  titleId: string;
  conceptId: string;
  productId: string | null;
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
    return { total: 0, matched: 0, upserted: 0, unmatched: 0, imported: 0, done: true };
  }

  onProgress?.({ phase: "resolving", total: games.length });

  await recordUserPlatformTitles(
    supabase as unknown as SupabaseClient,
    playerId,
    "playstation",
    games.map((g) => ({ sourceId: g.titleId, name: g.name }))
  );

  const items: ResolvableLibraryItem[] = games.map((g) => ({
    sourceId: g.titleId,
    name: g.name,
    uids: [g.conceptId, g.productId, g.titleId].filter((u): u is string => !!u),
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
      const gameId = resolved.get(g.titleId);
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

  // Different PSN title ids can resolve to the same local game — collapse them.
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
