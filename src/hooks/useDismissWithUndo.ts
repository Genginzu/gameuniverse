"use client";

import { useCallback, useRef, useState } from "react";
import { useLocale } from "next-intl";

import { useRecommendationDismissal } from "./useRecommendationDismissal";
import type { GameRecommendation } from "@/types/recommendation";

interface DismissedGame {
  id: string;
  slug: string;
  title: string;
}

/**
 * "Not interested" with a one-step undo; `failed` reports the last failed request.
 *
 * Undo waits for the pending dismissal: both requests share one in-flight id,
 * so an undo fired while the POST is still running would otherwise be dropped
 * and the game would stay dismissed on the server.
 */
export function useDismissWithUndo() {
  const locale = useLocale();
  const { trigger, isPending } = useRecommendationDismissal();
  const [lastDismissed, setLastDismissed] = useState<DismissedGame | null>(null);
  const [failed, setFailed] = useState(false);
  const pendingDismissal = useRef<Promise<unknown> | null>(null);

  const dismiss = useCallback(
    async (rec: GameRecommendation) => {
      setFailed(false);
      setLastDismissed({ id: rec.id, slug: rec.slug, title: rec.title });
      const request = trigger({ gameId: rec.id, dismissed: true, locale });
      pendingDismissal.current = request.catch(() => undefined);
      try {
        await request;
      } catch {
        setLastDismissed(null);
        setFailed(true);
      } finally {
        if (pendingDismissal.current === request) pendingDismissal.current = null;
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
      await pendingDismissal.current;
      const restored = await trigger({ gameId: id, dismissed: false, locale });
      if (restored === undefined) throw new Error("Undo ignored");
    } catch {
      setFailed(true);
    }
  }, [lastDismissed, trigger, locale]);

  return { dismiss, undo, lastDismissed, failed, isPending };
}
