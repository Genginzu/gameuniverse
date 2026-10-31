"use client";

import { useCallback, useState } from "react";
import { useLocale } from "next-intl";
import { useSWRConfig } from "swr";

import { personalRecommendationsKey } from "@/lib/swr/keys";
import type { QuickAction, QuickAddCallbacks } from "@/types/library";
import type { GameRecommendation, PersonalRecommendationsResponse } from "@/types/recommendation";

export interface AddedRecommendation {
  id: string;
  slug: string;
  title: string;
  list: QuickAction;
}

function withoutGame(gameId: string) {
  return (current: PersonalRecommendationsResponse | undefined) =>
    current && {
      ...current,
      recommendations: current.recommendations.filter((rec) => rec.id !== gameId),
    };
}

/**
 * Reactions of the recommendation rail to the shared card quick add: a game
 * entering the library or the wishlist leaves the rail at once (such games are
 * never recommended) and a notice confirms it. On failure the notice goes away
 * and the rail is fetched again (the quick add reports the error itself).
 */
export function useRecommendationQuickAdd() {
  const locale = useLocale();
  const { mutate } = useSWRConfig();
  const [lastAdded, setLastAdded] = useState<AddedRecommendation | null>(null);
  const key = personalRecommendationsKey(locale);

  const callbacksFor = useCallback(
    (rec: GameRecommendation): QuickAddCallbacks => ({
      onAdd: (list) => {
        setLastAdded({ id: rec.id, slug: rec.slug, title: rec.title, list });
        void mutate(key, withoutGame(rec.id), { revalidate: false });
      },
      onAddFailed: () => {
        setLastAdded((current) => (current?.id === rec.id ? null : current));
        void mutate(key);
      },
    }),
    [key, mutate]
  );

  return { lastAdded, callbacksFor };
}
