"use client";

/**
 * RecommendationsSection : personal recommendations scored from the library
 * (SQL, one pass), each with "not interested" (undoable) and "add to library".
 */

import { useTranslations } from "next-intl";

import { useAddRecommendationToLibrary } from "@/hooks/useAddRecommendationToLibrary";
import { useDismissWithUndo } from "@/hooks/useDismissWithUndo";
import { usePersonalRecommendations } from "@/hooks/usePersonalRecommendations";
import { recommendationToGameSummary } from "@/lib/utils/recommendationToGameSummary";
import type { GameRecommendation } from "@/types/recommendation";
import { HomeEmptyState } from "./HomeEmptyState";
import { HomeGameRail, type HomeRailItem } from "./HomeGameRail";
import { HomeLoadingNotice } from "./HomeLoadingNotice";
import { HomeSection } from "./HomeSection";
import { RecommendationCardActions } from "./RecommendationCardActions";
import { RecommendationFeedback } from "./RecommendationFeedback";
import { RecomputeButton } from "./RecomputeButton";

export function RecommendationsSection() {
  const t = useTranslations("homeDashboard.recommendations");
  const { recommendations, basedOnGameCount, loading, recomputing, error, recompute } =
    usePersonalRecommendations();
  const dismissal = useDismissWithUndo();
  const addition = useAddRecommendationToLibrary();

  const isBusy = loading || recomputing;
  const actionPending = dismissal.isPending || addition.isPending;
  const toItem = (rec: GameRecommendation): HomeRailItem => ({
    game: recommendationToGameSummary(rec),
    action: (
      <RecommendationCardActions
        dismissLabel={t("dismiss", { title: rec.title })}
        addLabel={t("addToLibrary", { title: rec.title })}
        disabled={actionPending}
        onDismiss={() => dismissal.dismiss(rec)}
        onAdd={() => addition.add(rec)}
      />
    ),
  });
  // Hide stale cards while recomputing so the rail shows skeletons.
  const items = recomputing ? [] : recommendations.map(toItem);
  const emptyMessage = error ? t("error") : basedOnGameCount === 0 ? t("emptyLibrary") : t("empty");
  const canRecompute = basedOnGameCount > 0 || Boolean(error);
  const hasNotice = Boolean(dismissal.lastDismissed || addition.lastAdded);

  return (
    <HomeSection
      id="home-recommendations"
      kicker={t("kicker")}
      title={t("title")}
      action={
        canRecompute && (
          <RecomputeButton label={t("recompute")} busy={isBusy} onClick={recompute} />
        )
      }
    >
      {isBusy && <HomeLoadingNotice message={t("loading")} slowMessage={t("loadingSlow")} />}
      {!isBusy && error && items.length > 0 && (
        <p role="alert" className="-mt-2 text-sm text-red-400">
          {t("recomputeError")}
        </p>
      )}
      <RecommendationFeedback
        dismissed={dismissal.lastDismissed}
        added={addition.lastAdded}
        dismissFailed={dismissal.failed}
        addFailed={addition.failed}
        onUndo={dismissal.undo}
      />
      {basedOnGameCount > 0 && !isBusy && !error && !hasNotice && (
        <p className="text-editorial-muted -mt-2 text-sm">
          {t("basedOn", { count: basedOnGameCount })}
        </p>
      )}
      <HomeGameRail
        label={t("title")}
        items={items}
        isLoading={isBusy}
        empty={
          <HomeEmptyState
            icon="lucide:sparkles"
            message={emptyMessage}
            action={
              basedOnGameCount === 0 && !error
                ? { href: "/games", label: t("emptyAction") }
                : undefined
            }
          />
        }
      />
    </HomeSection>
  );
}
