import { EXTERNAL_GAME_CATEGORY } from "@/lib/services/igdb-external-games";
import {
  getXboxAuthForPlayer,
  xboxAuthorizationHeader,
  type XboxAuthContext,
} from "@/lib/services/xboxAuth";
import type { LibrarySyncAdapter, PlatformLibraryItem } from "@/types/library-sync";

const titleHistoryUrl = (xuid: string) =>
  `https://titlehub.xboxlive.com/users/xuid(${xuid})/titles/titleHistory/decoration/detail`;

export interface XboxTitle {
  titleId: string;
  name: string;
  type?: string;
  pfn?: string;
}

interface TitleHistoryResponse {
  titles?: XboxTitle[];
}

export function normalizeXboxTitles(titles: XboxTitle[]): PlatformLibraryItem[] {
  return titles
    .filter((title) => title.type !== "Application")
    .map((title) => ({
      sourceId: title.titleId,
      name: title.name,
      uids: [title.titleId, title.pfn].filter((uid): uid is string => !!uid),
    }));
}

async function fetchTitleHistory(auth: XboxAuthContext): Promise<XboxTitle[]> {
  const res = await fetch(titleHistoryUrl(auth.xuid), {
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

export const xboxAdapter: LibrarySyncAdapter = {
  platform: "xbox",
  externalCategory: EXTERNAL_GAME_CATEGORY.XBOX_MARKETPLACE,
  async fetchLibrary(supabase, userId) {
    const auth = await getXboxAuthForPlayer(supabase, userId);
    if (!auth) throw new Error("Xbox account not connected or refresh failed");
    return { items: normalizeXboxTitles(await fetchTitleHistory(auth)) };
  },
};
