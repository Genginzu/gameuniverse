import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { EXTERNAL_GAME_CATEGORY } from "./igdb-external-games";
import { resolveLibraryGames, type ResolvableLibraryItem } from "./libraryGameResolver";
import { getXboxAuthForPlayer, xboxAuthorizationHeader, type XboxAuthContext } from "./xboxAuth";
import type { LibrarySyncProgressCallback } from "@/types/library-sync";

const TITLE_HISTORY_URL = (xuid: string) =>
  `https://titlehub.xboxlive.com/users/xuid(${xuid})/titles/titleHistory/decoration/detail`;
const UPSERT_CHUNK = 200;
/** Cap on IGDB imports/searches per run (rate-limit + function-time budget). */
const MAX_IGDB_OPS_PER_SYNC = 30;

export interface XboxSyncResult {
  total: number;
  matched: number;
  upserted: number;
  unmatched: number;
  imported: number;
}

interface XboxTitle {
  titleId: string;
  name: string;
  type?: string;
  devices?: string[];
  displayImage?: string;
  pfn?: string;
  titleHistory?: {
    lastTimePlayed?: string;
  };
  stats?: {
    sourceVersion?: number;
  };
}

interface TitleHistoryResponse {
  titles?: XboxTitle[];
}

async function fetchTitleHistory(auth: XboxAuthContext): Promise<XboxTitle[]> {
  const res = await fetch(TITLE_HISTORY_URL(auth.xuid), {
    headers: {
      Authorization: xboxAuthorizationHeader(auth),
      "x-xbl-contract-version": "2",
      "Accept-Language": "en-US",
    },
  });
  if (!res.ok) throw new Error(`Xbox title history failed (${res.status})`);
  const data = (await res.json()) as TitleHistoryResponse;
  return data.titles ?? [];
}

export async function syncXboxLibrary(
  supabase: SupabaseClient<Database>,
  playerId: string,
  onProgress?: LibrarySyncProgressCallback
): Promise<XboxSyncResult> {
  onProgress?.({ phase: "fetching" });
  const auth = await getXboxAuthForPlayer(supabase, playerId);
  if (!auth) {
    throw new Error("Xbox account not connected or refresh failed");
  }

  const titles = await fetchTitleHistory(auth);
  const gameTitles = titles.filter((t) => t.type !== "Application");

  if (gameTitles.length === 0) {
    onProgress?.({ phase: "done", total: 0, processed: 0, matched: 0 });
    return { total: 0, matched: 0, upserted: 0, unmatched: 0, imported: 0 };
  }

  onProgress?.({ phase: "resolving", total: gameTitles.length });

  // Xbox title-history ids rarely line up with IGDB's xbox_marketplace uids, so
  // the shared resolver falls back to a strict name search (and imports missing
  // games) — mirroring the Steam/PSN behaviour.
  const items: ResolvableLibraryItem[] = gameTitles.map((t) => ({
    sourceId: t.titleId,
    name: t.name,
    uids: [t.titleId, t.pfn].filter((u): u is string => !!u),
  }));

  const { resolved, imported } = await resolveLibraryGames(
    supabase,
    items,
    EXTERNAL_GAME_CATEGORY.XBOX_MARKETPLACE,
    { importBudget: MAX_IGDB_OPS_PER_SYNC, onProgress }
  );

  const now = new Date().toISOString();
  const rows = gameTitles
    .map((t) => {
      const gameId = resolved.get(t.titleId);
      if (!gameId) return null;
      return {
        user_id: playerId,
        game_id: gameId,
        status: "owned",
        source_platform: "xbox",
        source_id: t.titleId,
        synced_at: now,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  onProgress?.({ phase: "saving", total: gameTitles.length, matched: rows.length, imported });

  let upserted = 0;
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error, count } = await supabase
      .from("user_library")
      .upsert(chunk, { onConflict: "user_id,game_id", count: "exact" });
    if (error) {
      logger.error("Failed to upsert Xbox user_library chunk", { error, chunkSize: chunk.length });
      throw error;
    }
    upserted += count ?? chunk.length;
    onProgress?.({ processed: upserted });
  }

  onProgress?.({
    phase: "done",
    total: gameTitles.length,
    processed: upserted,
    matched: rows.length,
    imported,
    unmatched: gameTitles.length - rows.length,
  });

  return {
    total: gameTitles.length,
    matched: rows.length,
    upserted,
    unmatched: gameTitles.length - rows.length,
    imported,
  };
}
