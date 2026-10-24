"use client";

/**
 * RecommendationsSection : personal recommendations scored from the library
 * (SQL, one pass), each with its "because of" source game and a
 * "not interested" control with undo.
 */

import { useTranslations } from "next-intl";

import { useDismissWithUndo } from "@/hooks/useDismissWithUndo";
import { usePersonalRecommendations } from "@/hooks/usePersonalRecommendations";
import { recommendationToGameSummary } from "@/lib/utils/recommendationToGameSummary";
import type { GameRecommendation } from "@/types/recommendation";
import { DismissRecommendationButton } from "./DismissRecommendationButton";
import { DismissedNotice } from "./DismissedNotice";
import { HomeEmptyState } from "./HomeEmptyState";
import { HomeGameRail, type HomeRailItem } from "./HomeGameRail";
import { HomeLoadingNotice } from "./HomeLoadingNotice";
import { HomeSection } from "./HomeSection";
import { RecomputeButton } from "./RecomputeButton";

export function RecommendationsSection() {
  const t = useTranslations("homeDashboard.recommendations");
  const { recommendations, basedOnGameCount, loading, recomputing, error, recompute } =
    usePersonalRecommendations();
  const { dismiss, undo, lastDismissed, failed, isPending } = useDismissWithUndo();

  const isBusy = loading || recomputing;
  const toItem = (rec: GameRecommendation): HomeRailItem => ({
    game: recommendationToGameSummary(rec),
    caption: rec.reason ? t("because", { title: rec.reason.title }) : undefined,
    action: (
      <DismissRecommendationButton
        label={t("dismiss", { title: rec.title })}
        disabled={isPending}
        onDismiss={() => dismiss(rec)}
      />
    ),
  });
  // Hide stale cards while recomputing so the rail shows skeletons.
  const items = recomputing ? [] : recommendations.map(toItem);
  const emptyMessage = error ? t("error") : basedOnGameCount === 0 ? t("emptyLibrary") : t("empty");
  const canRecompute = basedOnGameCount > 0 || Boolean(error);

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
      {failed && (
        <p role="alert" className="-mt-2 text-sm text-red-400">
          {t("dismissError")}
        </p>
      )}
      {lastDismissed && (
        <DismissedNotice
          message={t("dismissed", { title: lastDismissed.title })}
          undoLabel={t("undo")}
          onUndo={undo}
        />
      )}
      {basedOnGameCount > 0 && !isBusy && !error && !lastDismissed && (
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
