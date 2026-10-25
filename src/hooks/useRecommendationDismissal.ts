"use client";

import { useOptimisticMutation } from "./useOptimisticMutation";
import { affect } from "@/lib/swr/optimistic";
import { RECOMMENDATION_RELATED_KEYS, personalRecommendationsKey } from "@/lib/swr/keys";
import { jsonRequest } from "@/lib/utils/json-request";
import type { PersonalRecommendationsResponse } from "@/types/recommendation";

export interface RecommendationDismissalArgs {
  gameId: string;
  /** `true` = "not interested", `false` = undo. */
  dismissed: boolean;
  locale: string;
}

function requestDismissal({ gameId, dismissed }: RecommendationDismissalArgs) {
  return dismissed
    ? jsonRequest("/api/recommendations/dismissals", "POST", { gameId })
    : jsonRequest(`/api/recommendations/dismissals/${gameId}`, "DELETE");
}

function withoutGame(gameId: string) {
  return (current: PersonalRecommendationsResponse | undefined) =>
    current && {
      ...current,
      recommendations: current.recommendations.filter((rec) => rec.id !== gameId),
    };
}

/**
 * Optimistic "not interested" / undo on personal recommendations. Dismissing
 * removes the card at once; both directions revalidate the recommendation lists.
 */
export function useRecommendationDismissal() {
  return useOptimisticMutation<RecommendationDismissalArgs>({
    request: requestDismissal,
    affects: ({ gameId, dismissed, locale }) =>
      dismissed
        ? [affect<PersonalRecommendationsResponse>(personalRecommendationsKey(locale), withoutGame(gameId))]
        : [],
    related: () => RECOMMENDATION_RELATED_KEYS,
    dedupeId: ({ gameId }) => `recommendation-dismissal:${gameId}`,
  });
}
