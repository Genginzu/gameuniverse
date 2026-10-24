"use client";

import { useCallback, useState } from "react";
import { useLocale } from "next-intl";

import { useRecommendationDismissal } from "./useRecommendationDismissal";
import type { GameRecommendation } from "@/types/recommendation";

interface DismissedGame {
  id: string;
  title: string;
}

/** "Not interested" with a one-step undo; `failed` reports the last failed request. */
export function useDismissWithUndo() {
  const locale = useLocale();
  const { trigger, isPending } = useRecommendationDismissal();
  const [lastDismissed, setLastDismissed] = useState<DismissedGame | null>(null);
  const [failed, setFailed] = useState(false);

  const dismiss = useCallback(
    async (rec: GameRecommendation) => {
      setFailed(false);
      setLastDismissed({ id: rec.id, title: rec.title });
      try {
        await trigger({ gameId: rec.id, dismissed: true, locale });
      } catch {
        setLastDismissed(null);
        setFailed(true);
      }
    },
    [trigger, locale]
  );

  const undo = useCallback(async () => {
    if (!lastDismissed) return;
    const { id } = lastDismissed;
    setLastDismissed(null);
    setFailed(false);
    try {
      await trigger({ gameId: id, dismissed: false, locale });
    } catch {
      setFailed(true);
    }
  }, [lastDismissed, trigger, locale]);

  return { dismiss, undo, lastDismissed, failed, isPending };
}
