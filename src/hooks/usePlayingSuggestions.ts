"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";

import { toast } from "./use-toast";
import { useLibraryStatusChange } from "./useLibraryStatusChange";
import { buildLibraryUrl } from "@/lib/utils/libraryQueryParams";
import type { LibraryGame, LibraryResponse } from "@/types/library";

/** "Continue playing" is filled up to this many cards with suggestions. */
export const CONTINUE_PLAYING_TARGET = 5;

/** Fixed limit so the key stays stable whatever the number of missing cards. */
export const PLAYING_SUGGESTIONS_URL = buildLibraryUrl({
  status: "owned",
  limit: CONTINUE_PLAYING_TARGET,
});

/**
 * Latest owned games of the library, suggested to fill "Continue playing",
 * with a one-click switch to "playing". Fetched only while cards are missing.
 */
export function usePlayingSuggestions(missing: number) {
  const t = useTranslations("homeDashboard.continuePlaying");
  const { data, error } = useSWR<LibraryResponse>(missing > 0 ? PLAYING_SUGGESTIONS_URL : null, {
    onError: () => {},
    revalidateOnFocus: false,
  });
  const { trigger, isPending } = useLibraryStatusChange();

  const markPlaying = useCallback(
    async (gameId: string) => {
      try {
        await trigger({ gameId, status: "playing" });
      } catch {
        toast({ title: t("markPlayingError"), variant: "destructive" });
      }
    },
    [trigger, t]
  );

  const games: LibraryGame[] = (data?.games ?? [])
    .filter((game) => game.libraryStatus === "owned")
    .slice(0, Math.max(missing, 0));

  return {
    games,
    loading: missing > 0 && !data && !error,
    markPlaying,
    isPending,
  };
}
