import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { EXTERNAL_GAME_CATEGORY } from "./igdb-external-games";
import { resolveLibraryGames, dedupeByGameId, type ResolvableLibraryItem } from "./libraryGameResolver";
import { recordUserPlatformTitles } from "./librarySyncBackfill";
import { decryptPlatformToken } from "./platformTokens";
import type { LibrarySyncProgressCallback } from "@/types/library-sync";

const OWNED_KEYS_URL = "https://api.itch.io/profile/owned-keys";
const UPSERT_CHUNK = 200;
/** Safety cap on paginated owned-keys pages. */
const MAX_PAGES = 40;
/** Cap on IGDB imports/searches per run (rate-limit + function-time budget). */
const MAX_IGDB_OPS_PER_SYNC = 30;

export interface ItchSyncResult {
  total: number;
  matched: number;
  upserted: number;
  unmatched: number;
  imported: number;
  /** True when every title has been attempted (no more work to do). */
  done: boolean;
}

interface ItchGame {
  sourceId: string;
  name: string;
}

interface OwnedKey {
  game?: {
    id?: number;
    title?: string;
    classification?: string;
  };
}

/** itch access tokens don't expire and have no refresh flow — read directly. */
async function getItchToken(
  supabase: SupabaseClient<Database>,
  playerId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("player_linked_platforms")
    .select("access_token")
    .eq("player_id", playerId)
    .eq("platform", "itch")
    .maybeSingle();
  if (!data?.access_token) return null;
  try {
    return decryptPlatformToken(data.access_token);
  } catch (err) {
    logger.error("Failed to decrypt itch token", { playerId, err });
    return null;
  }
}

async function fetchItchLibrary(token: string): Promise<ItchGame[]> {
  const games: ItchGame[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await fetch(`${OWNED_KEYS_URL}?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`itch owned-keys failed (${res.status})`);
    const data = (await res.json()) as { owned_keys?: OwnedKey[] };
    const keys = data.owned_keys ?? [];
    for (const key of keys) {
      const g = key.game;
      // Keep games (skip tools/assets/soundtracks). Missing classification = keep.
      if (g?.id && g.title && (!g.classification || g.classification === "game")) {
        games.push({ sourceId: String(g.id), name: g.title });
      }
    }
    if (keys.length === 0) break;
  }
  return games;
}

export async function syncItchLibrary(
  supabase: SupabaseClient<Database>,
  playerId: string,
  onProgress?: LibrarySyncProgressCallback
): Promise<ItchSyncResult> {
  onProgress?.({ phase: "fetching" });

  const token = await getItchToken(supabase, playerId);
  if (!token) {
    throw new Error("itch.io account not connected");
  }

  const games = await fetchItchLibrary(token);
  if (games.length === 0) {
    onProgress?.({ phase: "done", total: 0, processed: 0, matched: 0 });
    return { total: 0, matched: 0, upserted: 0, unmatched: 0, imported: 0, done: true };
  }

  onProgress?.({ phase: "resolving", total: games.length });

  await recordUserPlatformTitles(
    supabase as unknown as SupabaseClient,
    playerId,
    "itch",
    games.map((g) => ({ sourceId: g.sourceId, name: g.name }))
  );

  const items: ResolvableLibraryItem[] = games.map((g) => ({
    sourceId: g.sourceId,
    name: g.name,
    uids: [g.sourceId], // itch game id → IGDB external_games (ITCH_IO)
  }));

  const { resolved, imported, pending } = await resolveLibraryGames(
    supabase,
    items,
    EXTERNAL_GAME_CATEGORY.ITCH_IO,
    { platform: "itch", importBudget: MAX_IGDB_OPS_PER_SYNC, onProgress }
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
        source_platform: "itch",
        source_id: g.sourceId,
        synced_at: now,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  onProgress?.({ phase: "saving", total: games.length, matched: rows.length, imported });

  const dedupedRows = dedupeByGameId(rows);

  let upserted = 0;
  for (let i = 0; i < dedupedRows.length; i += UPSERT_CHUNK) {
    const chunk = dedupedRows.slice(i, i + UPSERT_CHUNK);
    const { error, count } = await supabase
      .from("user_library")
      .upsert(chunk, { onConflict: "user_id,game_id", count: "exact" });
    if (error) {
      logger.error("Failed to upsert itch user_library chunk", { error, chunkSize: chunk.length });
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
