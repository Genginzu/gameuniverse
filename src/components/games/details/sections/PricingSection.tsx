"use client";

/**
 * Section "Where to buy" : comparaison multi-store, sortée par prix.
 * Carte la moins chère reçoit un badge "Best" en accent.
 *
 * Note : le projet n'a pas (encore) de discount sur GamePricing, donc on
 * affiche juste le prix actuel par store.
 */

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { GameDetails } from "@/types/game";
import { accentRich } from "../utils/accent-rich";

interface PricingSectionProps {
  game: GameDetails;
  formatPrice: (price: number, currency: string) => string;
}

export function PricingSection({ game, formatPrice }: PricingSectionProps) {
  const tEd = useTranslations("gameDetails.editorial");
  if (game.pricing.length === 0) return null;

  const sorted = [...game.pricing].sort((a, b) => a.price - b.price);

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <KickerLabel className="mb-3">10 — {tEd("sections.whereToBuy")}</KickerLabel>
      <h2 className="editorial-game-detail-bento-display editorial-game-detail-bento-display-md mb-10">
        {tEd.rich("sections.whereToBuyTitle", accentRich)}
      </h2>

      <div className="editorial-game-detail-price-grid">
        {sorted.map((p, index) => {
          const isBest = index === 0;
          return (
            <SpotlightCard
              key={`${p.store.name}-${p.platform}-${index}`}
              className="editorial-game-detail-price-card"
            >
              <div className="editorial-game-detail-price-head">
                <div>
                  <KickerLabel>{p.platform}</KickerLabel>
                  <p className="editorial-game-detail-price-store">
                    {p.store.logoUrl ? (
                      <span className="inline-flex items-center gap-2">
                        <Image
                          src={p.store.logoUrl}
                          alt={p.store.name}
                          width={20}
                          height={20}
                          className="rounded"
                          unoptimized
                        />
                        {p.store.name}
                      </span>
                    ) : (
                      p.store.name
                    )}
                  </p>
                </div>
                {isBest && <span className="editorial-game-detail-price-best">Best</span>}
              </div>

              <div>
                <span className="editorial-game-detail-price-amount">
                  {formatPrice(p.price, p.currency)}
                </span>
              </div>

              {p.storeUrl && (
                <a
                  href={p.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="editorial-game-detail-price-cta"
                >
                  {tEd("review.buy", { store: p.store.name })}
                  <Icon icon="lucide:arrow-up-right" className="h-3.5 w-3.5" />
                </a>
              )}
            </SpotlightCard>
          );
        })}
      </div>
    </section>
  );
}
