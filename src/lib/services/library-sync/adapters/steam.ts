import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { EXTERNAL_GAME_CATEGORY } from "@/lib/services/igdb-external-games";
import type {
  LibrarySyncAdapter,
  PlatformLibraryFetch,
  PlatformLibraryItem,
} from "@/types/library-sync";

const STEAM_OWNED_GAMES_URL = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/";

interface SteamOwnedGame {
  appid: number;
  playtime_forever?: number;
  name?: string;
}

export interface SteamOwnedGamesResponse {
  response?: {
    game_count?: number;
    games?: SteamOwnedGame[];
  };
}

export function normalizeSteamLibrary(data: SteamOwnedGamesResponse): PlatformLibraryFetch {
  const response = data.response ?? {};
  const items = (response.games ?? [])
    .map((game) => ({
      sourceId: String(game.appid),
      name: game.name ?? "",
      uids: [String(game.appid)],
      playtimeMinutes: game.playtime_forever ?? 0,
    }))
    .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes);
  return { items, privateProfile: response.game_count === undefined };
}

async function loadSteamId(supabase: SupabaseClient<Database>, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("player_linked_platforms")
    .select("external_id")
    .eq("player_id", userId)
    .eq("platform", "steam")
    .maybeSingle();
  if (error) throw error;
  if (!data?.external_id) throw new Error("Steam account not linked");
  return data.external_id;
}

async function fetchOwnedGames(steamId: string): Promise<SteamOwnedGamesResponse> {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) throw new Error("STEAM_API_KEY is not set");

  const query = new URLSearchParams({
    key: apiKey,
    steamid: steamId,
    include_appinfo: "1",
    include_played_free_games: "1",
    format: "json",
  });
  const res = await fetch(`${STEAM_OWNED_GAMES_URL}?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Steam GetOwnedGames failed (${res.status})`);
  return (await res.json()) as SteamOwnedGamesResponse;
}

async function findKnownSteamGames(
  supabase: SupabaseClient<Database>,
  items: PlatformLibraryItem[]
): Promise<Map<string, string>> {
  const known = new Map<string, string>();
  const appids = items.map((item) => Number(item.sourceId)).filter(Number.isInteger);
  if (appids.length === 0) return known;

  const { data, error } = await supabase
    .from("games")
    .select("id, steam_appid")
    .in("steam_appid", appids);
  if (error) throw error;
  for (const row of data ?? []) {
    if (row.steam_appid !== null) known.set(String(row.steam_appid), row.id);
  }
  return known;
}

export const steamAdapter: LibrarySyncAdapter = {
  platform: "steam",
  externalCategory: EXTERNAL_GAME_CATEGORY.STEAM,
  async fetchLibrary(supabase, userId) {
    const steamId = await loadSteamId(supabase, userId);
    return normalizeSteamLibrary(await fetchOwnedGames(steamId));
  },
  findKnownGames: findKnownSteamGames,
  pickDuplicate(existing, candidate) {
    return (candidate.playtimeMinutes ?? 0) > (existing.playtimeMinutes ?? 0)
      ? candidate
      : existing;
  },
};
