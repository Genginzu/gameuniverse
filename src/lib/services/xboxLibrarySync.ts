import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { EXTERNAL_GAME_CATEGORY, resolveIgdbIdsByExternalUids } from "./igdb-external-games";
import { getXboxAuthForPlayer, xboxAuthorizationHeader, type XboxAuthContext } from "./xboxAuth";

const TITLE_HISTORY_URL = (xuid: string) =>
  `https://titlehub.xboxlive.com/users/xuid(${xuid})/titles/titleHistory/decoration/detail`;
const UPSERT_CHUNK = 200;

export interface XboxSyncResult {
  total: number;
  matched: number;
  upserted: number;
  unmatched: number;
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

async function resolveTitleIdsToGameIds(
  supabase: SupabaseClient<Database>,
  titleIds: string[]
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  if (titleIds.length === 0) return resolved;

  const uidToIgdb = await resolveIgdbIdsByExternalUids(
    titleIds,
    EXTERNAL_GAME_CATEGORY.XBOX_MARKETPLACE
  );
  if (uidToIgdb.size === 0) return resolved;

  const igdbIds = Array.from(new Set(uidToIgdb.values()));
  const { data: rows, error } = await supabase
    .from("games")
    .select("id, igdb_id")
    .in("igdb_id", igdbIds);

  if (error) throw error;

  const igdbIdToGameId = new Map<number, string>();
  for (const row of rows ?? []) {
    if (row.igdb_id !== null) igdbIdToGameId.set(row.igdb_id, row.id);
  }

  for (const [uid, igdbId] of uidToIgdb.entries()) {
    const gameId = igdbIdToGameId.get(igdbId);
    if (gameId) resolved.set(uid, gameId);
  }

  return resolved;
}

export async function syncXboxLibrary(
  supabase: SupabaseClient<Database>,
  playerId: string
): Promise<XboxSyncResult> {
  const auth = await getXboxAuthForPlayer(supabase, playerId);
  if (!auth) {
    throw new Error("Xbox account not connected or refresh failed");
  }

  const titles = await fetchTitleHistory(auth);
  const gameTitles = titles.filter((t) => t.type !== "Application");

  if (gameTitles.length === 0) {
    return { total: 0, matched: 0, upserted: 0, unmatched: 0 };
  }

  const idMap = await resolveTitleIdsToGameIds(
    supabase,
    gameTitles.map((t) => t.titleId)
  );

  const now = new Date().toISOString();
  const rows = gameTitles
    .map((t) => {
      const gameId = idMap.get(t.titleId);
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
  }

  return {
    total: gameTitles.length,
    matched: rows.length,
    upserted,
    unmatched: gameTitles.length - rows.length,
  };
}
