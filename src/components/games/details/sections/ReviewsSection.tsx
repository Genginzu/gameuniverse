"use client";

/**
 * Section "Community voice" : reviews wrappées dans un heading magazine.
 * Conserve toute la logique du composant existant `GameReviewsTab`
 * (SWR fetch, vote helpful/not helpful, write review dialog, etc.).
 */

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { GameDetails } from "@/types/game";
import { renderAccentSegments } from "../utils/render-accent-segments";

const GameReviewsTab = dynamic(
  () => import("../../reviews/GameReviewsTab").then((m) => m.GameReviewsTab),
  { loading: () => <ReviewsSkeleton /> }
);

interface ReviewsSectionProps {
  game: GameDetails;
}

export function ReviewsSection({ game }: ReviewsSectionProps) {
  const tEd = useTranslations("gameDetails.editorial");

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <div className="editorial-game-detail-section-header">
        <div>
          <KickerLabel className="mb-3">12 — {tEd("sections.communityVoice")}</KickerLabel>
          <h2>{renderAccentSegments(tEd("sections.communityVoiceTitle"))}</h2>
        </div>
      </div>
      <GameReviewsTab gameId={game.id} gameTitle={game.title} accentColor={game.accentColor} />
    </section>
  );
}

/** Skeleton de chargement de la section reviews. */
function ReviewsSkeleton() {
  const card = "rounded-xl border border-[var(--editorial-line)] bg-[var(--editorial-bg-2)] p-5";
  const pulse = "animate-pulse rounded bg-white/10";

  return (
    <div className="space-y-4">
      <div className={`${card} flex items-center gap-3`}>
        <div className={`h-6 w-6 ${pulse}`} />
        <div className={`h-7 w-16 ${pulse}`} />
        <div className={`h-4 w-24 ${pulse}`} />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={card}>
          <div className="mb-4 flex items-center gap-3">
            <div className={`h-10 w-10 ${pulse} rounded-full`} />
            <div className="space-y-2">
              <div className={`h-4 w-24 ${pulse}`} />
              <div className={`h-3 w-16 ${pulse}`} />
            </div>
          </div>
          <div className="space-y-2">
            <div className={`h-3 w-full ${pulse}`} />
            <div className={`h-3 w-3/4 ${pulse}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
