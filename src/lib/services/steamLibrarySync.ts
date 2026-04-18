import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import {
  EXTERNAL_GAME_CATEGORY,
  resolveIgdbIdsByExternalUids,
} from "./igdb-external-games";
import { GameImportService } from "./gameImportService";

const STEAM_OWNED_GAMES_URL = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/";
const UPSERT_CHUNK = 200;
/**
 * Cap on how many missing games we import from IGDB in a single sync run.
 * IGDB imports are expensive (multiple API calls + image downloads), so we
 * import the most-played missing titles first and leave the rest for the
 * next sync.
 */
const MAX_IMPORTS_PER_SYNC = 30;

export interface SteamSyncResult {
  total: number;
  matched: number;
  upserted: number;
  unmatched: number;
  imported: number;
  /** True when Steam returned no game_count (private profile) vs empty library. */
  privateProfile?: boolean;
}

interface SteamOwnedGame {
  appid: number;
  playtime_forever?: number;
  name?: string;
  rtime_last_played?: number;
}

interface SteamOwnedGamesResponse {
  response?: {
    game_count?: number;
    games?: SteamOwnedGame[];
  };
}

interface SteamLibraryResult {
  games: SteamOwnedGame[];
  /** True when Steam didn't return a game_count (profile is private). */
  privateProfile: boolean;
}

async function fetchSteamLibrary(steamId: string): Promise<SteamLibraryResult> {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) throw new Error("STEAM_API_KEY is not set");

  const url = `${STEAM_OWNED_GAMES_URL}?${new URLSearchParams({
    key: apiKey,
    steamid: steamId,
    include_appinfo: "1",
    include_played_free_games: "1",
    format: "json",
  }).toString()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Steam GetOwnedGames failed (${res.status})`);
  }
  const data = (await res.json()) as SteamOwnedGamesResponse;
  const response = data.response ?? {};
  // Steam returns `{ response: {} }` (no `game_count`) for private profiles.
  const privateProfile = response.game_count === undefined;
  return {
    games: response.games ?? [],
    privateProfile,
  };
}

interface ResolutionResult {
  resolved: Map<number, string>;
  imported: number;
}

/**
 * Match Steam appids against the local `games` table via `steam_appid`,
 * back-filling missing mappings from IGDB's `external_games` endpoint.
 *
 * For the top-priority appids (most played, passed first in `orderedAppids`)
 * that still don't exist locally, we import them from IGDB — up to
 * `importBudget` imports per run. Remaining unmatched appids will be picked
 * up on a future sync.
 */
async function resolveAppidsToGameIds(
  supabase: SupabaseClient<Database>,
  orderedAppids: number[],
  importBudget: number
): Promise<ResolutionResult> {
  const resolved = new Map<number, string>();
  if (orderedAppids.length === 0) return { resolved, imported: 0 };

  // 1. What do we already know locally via the steam_appid cache?
  const { data: existing, error: existingError } = await supabase
    .from("games")
    .select("id, steam_appid")
    .in("steam_appid", orderedAppids);

  if (existingError) throw existingError;
  for (const row of existing ?? []) {
    if (row.steam_appid !== null) resolved.set(row.steam_appid, row.id);
  }

  const missing = orderedAppids.filter((a) => !resolved.has(a));
  if (missing.length === 0) return { resolved, imported: 0 };

  // 2. Ask IGDB to turn Steam appids into IGDB game ids (external_games).
  const uidToIgdb = await resolveIgdbIdsByExternalUids(missing, EXTERNAL_GAME_CATEGORY.STEAM);
  if (uidToIgdb.size === 0) return { resolved, imported: 0 };

  // 3. Match those IGDB ids to rows we already have, and back-fill steam_appid.
  const igdbIds = Array.from(new Set(uidToIgdb.values()));
  const { data: igdbMatches, error: igdbError } = await supabase
    .from("games")
    .select("id, igdb_id")
    .in("igdb_id", igdbIds);

  if (igdbError) throw igdbError;

  const igdbIdToGameId = new Map<number, string>();
  for (const row of igdbMatches ?? []) {
    if (row.igdb_id !== null) igdbIdToGameId.set(row.igdb_id, row.id);
  }

  // Preserve the input ordering so we import highest-priority games first.
  const importQueue: Array<{ appid: number; igdbId: number }> = [];
  for (const appid of missing) {
    const igdbId = uidToIgdb.get(String(appid));
    if (!igdbId) continue;
    const gameId = igdbIdToGameId.get(igdbId);
    if (gameId) {
      resolved.set(appid, gameId);
    } else {
      importQueue.push({ appid, igdbId });
    }
  }

  // Back-fill steam_appid on rows we just resolved via igdb_id.
  for (const appid of missing) {
    const gameId = resolved.get(appid);
    if (!gameId) continue;
    const { error } = await supabase
      .from("games")
      .update({ steam_appid: appid })
      .eq("id", gameId);
    if (error) {
      logger.error("Failed to back-fill games.steam_appid", { error, id: gameId });
    }
  }

  // 4. Import the top `importBudget` missing games from IGDB. Each import
  //    creates the game row + related entities, then we back-fill steam_appid.
  let imported = 0;
  for (const { appid, igdbId } of importQueue) {
    if (imported >= importBudget) break;
    try {
      const result = await GameImportService.importFromIGDB(igdbId);
      if (!result.success || !result.game) {
        logger.warn("Skipping IGDB import during Steam sync", {
          igdbId,
          appid,
          error: result.error,
        });
        continue;
      }
      // Re-fetch the local game id (importFromIGDB returns details, not the UUID).
      const { data: newRow, error: lookupError } = await supabase
        .from("games")
        .select("id")
        .eq("igdb_id", igdbId)
        .maybeSingle();
      if (lookupError || !newRow) continue;

      resolved.set(appid, newRow.id);
      imported += 1;

      const { error: backfillError } = await supabase
        .from("games")
        .update({ steam_appid: appid })
        .eq("id", newRow.id);
      if (backfillError) {
        logger.error("Failed to set steam_appid after import", { error: backfillError, appid });
      }
    } catch (err) {
      logger.error("IGDB import threw during Steam sync", { igdbId, appid, err });
    }
  }

  return { resolved, imported };
}

export async function syncSteamLibrary(
  supabase: SupabaseClient<Database>,
  playerId: string,
  steamId: string
): Promise<SteamSyncResult> {
  const { games, privateProfile } = await fetchSteamLibrary(steamId);
  if (games.length === 0) {
    return {
      total: 0,
      matched: 0,
      upserted: 0,
      unmatched: 0,
      imported: 0,
      privateProfile,
    };
  }

  // Priority: most-played first (so the 30-import budget goes to what the
  // user actually cares about).
  const ordered = [...games].sort(
    (a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0)
  );

  const { resolved, imported } = await resolveAppidsToGameIds(
    supabase,
    ordered.map((g) => g.appid),
    MAX_IMPORTS_PER_SYNC
  );

  const now = new Date().toISOString();
  const rows = games
    .map((g) => {
      const gameId = resolved.get(g.appid);
      if (!gameId) return null;
      const playtimeMinutes = g.playtime_forever ?? 0;
      return {
        user_id: playerId,
        game_id: gameId,
        status: "owned",
        source_platform: "steam",
        source_id: String(g.appid),
        external_playtime_seconds: playtimeMinutes * 60,
        play_time_hours: Math.round(playtimeMinutes / 60),
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
      logger.error("Failed to upsert user_library chunk", { error, chunkSize: chunk.length });
      throw error;
    }
    upserted += count ?? chunk.length;
  }

  return {
    total: games.length,
    matched: rows.length,
    upserted,
    unmatched: games.length - rows.length,
    imported,
    privateProfile: false,
  };
}
