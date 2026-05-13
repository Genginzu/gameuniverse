"use client";

/**
 * Section "Price history" : wrapper editorial autour du composant
 * fonctionnel `PriceHistoryTab` existant. On garde toute la logique
 * SWR/chart Recharts intacte, on encadre juste avec un heading magazine.
 */

import { useTranslations } from "next-intl";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { PriceHistoryTab } from "../PriceHistoryTab";
import type { GameDetails } from "@/types/game";
import { renderAccentSegments } from "../utils/render-accent-segments";

interface PriceHistorySectionProps {
  game: GameDetails;
}

export function PriceHistorySection({ game }: PriceHistorySectionProps) {
  const tEd = useTranslations("gameDetails.editorial");

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <div className="mb-8">
        <KickerLabel className="mb-3">11 — {tEd("sections.priceHistory")}</KickerLabel>
        <h2 className="editorial-game-detail-bento-display editorial-game-detail-bento-display-md">
          {renderAccentSegments(tEd("sections.priceHistoryTitle"))}
        </h2>
      </div>
      <PriceHistoryTab gameSlug={game.slug} currentPrice={game.pricing?.[0]?.price} />
    </section>
  );
}
