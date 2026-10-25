"use client";

/**
 * RecommendationsSection : personal recommendations computed from the library,
 * with a "recompute" button that bypasses the server cache.
 */

import { useTranslations } from "next-intl";

import { usePersonalRecommendations } from "@/hooks/usePersonalRecommendations";
import { recommendationToGameSummary } from "@/lib/utils/recommendationToGameSummary";
import { HomeEmptyState } from "./HomeEmptyState";
import { HomeGameRail } from "./HomeGameRail";
import { HomeLoadingNotice } from "./HomeLoadingNotice";
import { HomeSection } from "./HomeSection";
import { RecomputeButton } from "./RecomputeButton";

export function RecommendationsSection() {
  const t = useTranslations("homeDashboard.recommendations");
  const { recommendations, basedOnGameCount, loading, recomputing, error, recompute } =
    usePersonalRecommendations();

  const isBusy = loading || recomputing;
  // Hide stale cards while recomputing so the rail shows skeletons.
  const items = recomputing
    ? []
    : recommendations.map((rec) => ({ game: recommendationToGameSummary(rec) }));
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
      {basedOnGameCount > 0 && !isBusy && !error && (
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
