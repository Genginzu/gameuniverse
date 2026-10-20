import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserTitles } from "psn-api";
import type { Database } from "@/lib/database.types";
import { EXTERNAL_GAME_CATEGORY } from "@/lib/services/igdb-external-games";
import { getValidAccessToken } from "@/lib/services/platform-connection";
import type { LibrarySyncAdapter, PlatformLibraryItem } from "@/types/library-sync";

const PSN_PAGE_LIMIT = 100;
const PSN_MAX_TITLES = 800;

export interface PsnTrophyTitle {
  npCommunicationId: string;
  trophyTitleName: string;
}

export function normalizePsnTitles(titles: PsnTrophyTitle[]): PlatformLibraryItem[] {
  return titles.map((title) => ({
    sourceId: title.npCommunicationId,
    name: title.trophyTitleName,
    uids: [],
  }));
}

async function loadAccountId(supabase: SupabaseClient<Database>, userId: string): Promise<string> {
  const { data } = await supabase
    .from("player_linked_platforms")
    .select("external_id")
    .eq("player_id", userId)
    .eq("platform", "playstation")
    .maybeSingle();
  if (!data?.external_id) throw new Error("PlayStation account id missing — reconnect the account");
  return data.external_id;
}

async function fetchTrophyTitles(
  accessToken: string,
  accountId: string
): Promise<PsnTrophyTitle[]> {
  const titles: PsnTrophyTitle[] = [];
  let offset = 0;

  while (titles.length < PSN_MAX_TITLES) {
    const page = await getUserTitles({ accessToken }, accountId, { limit: PSN_PAGE_LIMIT, offset });
    const pageTitles = page.trophyTitles ?? [];
    titles.push(...pageTitles);
    if (pageTitles.length === 0 || page.nextOffset === undefined || page.nextOffset <= offset)
      break;
    offset = page.nextOffset;
  }

  return titles;
}

export const playstationAdapter: LibrarySyncAdapter = {
  platform: "playstation",
  externalCategory: EXTERNAL_GAME_CATEGORY.PLAYSTATION_STORE_US,
  async fetchLibrary(supabase, userId) {
    const accessToken = await getValidAccessToken(supabase, userId, "playstation");
    if (!accessToken) {
      throw new Error("PlayStation account not connected or token refresh failed");
    }
    const accountId = await loadAccountId(supabase, userId);
    return { items: normalizePsnTitles(await fetchTrophyTitles(accessToken, accountId)) };
  },
};
