"use client";

import { useCallback, useState } from "react";
import { useLocale } from "next-intl";

import { useOptimisticMutation } from "./useOptimisticMutation";
import { affect } from "@/lib/swr/optimistic";
import { LIBRARY_RELATED_KEYS, libraryStatusKey, personalRecommendationsKey } from "@/lib/swr/keys";
import { libraryStatusUpdater } from "@/lib/swr/updaters/library";
import { jsonRequest } from "@/lib/utils/json-request";
import type { LibraryStatusResponse } from "@/types/library";
import type { GameRecommendation, PersonalRecommendationsResponse } from "@/types/recommendation";

interface AddedGame {
  id: string;
  slug: string;
  title: string;
}

function withoutGame(gameId: string) {
  return (current: PersonalRecommendationsResponse | undefined) =>
    current && {
      ...current,
      recommendations: current.recommendations.filter((rec) => rec.id !== gameId),
      basedOnGameCount: current.basedOnGameCount + 1,
    };
}

/**
 * Adds a recommended game to the library ("owned"). The card leaves the rail
 * at once (library games are never recommended); library and recommendation
 * lists are revalidated once the server confirms.
 */
export function useAddRecommendationToLibrary() {
  const locale = useLocale();
  const [lastAdded, setLastAdded] = useState<AddedGame | null>(null);
  const [failed, setFailed] = useState(false);
  const { trigger, isPending } = useOptimisticMutation<{ gameId: string }>({
    request: ({ gameId }) => jsonRequest("/api/library", "POST", { gameId }),
    affects: ({ gameId }) => [
      affect<LibraryStatusResponse>(libraryStatusKey(gameId), libraryStatusUpdater(true)),
      affect<PersonalRecommendationsResponse>(personalRecommendationsKey(locale), withoutGame(gameId)),
    ],
    related: () => LIBRARY_RELATED_KEYS,
    dedupeId: ({ gameId }) => `library:${gameId}`,
  });

  const add = useCallback(
    async (rec: GameRecommendation) => {
      setFailed(false);
      setLastAdded({ id: rec.id, slug: rec.slug, title: rec.title });
      try {
        await trigger({ gameId: rec.id });
      } catch {
        setLastAdded(null);
        setFailed(true);
      }
    },
    [trigger]
  );

  return { add, lastAdded, failed, isPending };
}
