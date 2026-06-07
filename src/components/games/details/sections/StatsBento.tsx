"use client";

/**
 * Section "At a glance" : grille bento asymétrique (POC variant G).
 *
 * Pavé XL : metascore 7xl/9xl avec phrase d'accompagnement.
 * Cellules normales : prix mini, age, date de sortie.
 * Cellules wide (col-span-2) : plateformes, dev/publisher, genres.
 *
 * Toutes les cards sont des SpotlightCard (halo curseur).
 */

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { GameDetails } from "@/types/game";
import { getPlatformIcon } from "@/lib/utils/platform-icons";

interface StatsBentoProps {
  game: GameDetails;
  formatPrice: (price: number, currency: string) => string;
}

export function StatsBento({ game, formatPrice }: StatsBentoProps) {
  const tEd = useTranslations("gameDetails.editorial");

  const cheapest =
    game.pricing.length > 0
      ? game.pricing.reduce((min, p) => (p.price < min.price ? p : min), game.pricing[0])
      : null;

  const pegi =
    game.ageRatings?.find((r) => r.system?.toUpperCase().includes("PEGI")) ?? game.ageRatings?.[0];

  const releaseDate = game.releaseDate ? new Date(game.releaseDate) : null;
  const developer = game.companies?.developers?.[0]?.name ?? game.developer;
  const publisher = game.companies?.publishers?.[0]?.name ?? game.publisher;

  const metascoreText = (() => {
    if (!game.metascore || game.metascore <= 0) return null;
    if (game.metascore >= 90) return tEd("metascoreRating.exceptional");
    if (game.metascore >= 75) return tEd("metascoreRating.excellent");
    if (game.metascore >= 60) return tEd("metascoreRating.good");
    return tEd("metascoreRating.mixed");
  })();

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <KickerLabel className="mb-6">02 — {tEd("sections.atGlance")}</KickerLabel>

      <div className="editorial-game-detail-bento">
        {/* Metascore — XL */}
        {game.metascore !== undefined && game.metascore > 0 && (
          <SpotlightCard className="editorial-game-detail-bento-cell editorial-game-detail-bento-cell--xl">
            <KickerLabel className="mb-3">Metascore</KickerLabel>
            <p className="editorial-game-detail-bento-display editorial-game-detail-bento-display-xl">
              {game.metascore}
              <span className="editorial-game-detail-bento-suffix">/100</span>
            </p>
            {metascoreText && <p className="editorial-game-detail-bento-helper">{metascoreText}</p>}
          </SpotlightCard>
        )}

        {/* Cheapest price */}
        {cheapest && (
          <SpotlightCard className="editorial-game-detail-bento-cell">
            <KickerLabel className="mb-3">{tEd("lowestPrice")}</KickerLabel>
            <p className="editorial-game-detail-bento-display editorial-game-detail-bento-display-md accent">
              {formatPrice(cheapest.price, cheapest.currency)}
            </p>
          </SpotlightCard>
        )}

        {/* Age */}
        {pegi && (
          <SpotlightCard className="editorial-game-detail-bento-cell">
            <KickerLabel className="mb-3">Age</KickerLabel>
            <p className="editorial-game-detail-bento-display editorial-game-detail-bento-display-md">
              {pegi.system} {pegi.minimumAge !== null ? `${pegi.minimumAge}+` : pegi.rating}
            </p>
          </SpotlightCard>
        )}

        {/* Released */}
        {releaseDate && (
          <SpotlightCard className="editorial-game-detail-bento-cell">
            <KickerLabel className="mb-3">{tEd("released")}</KickerLabel>
            <p className="editorial-game-detail-bento-display editorial-game-detail-bento-display-md">
              {releaseDate.toLocaleDateString(undefined, { month: "short", day: "2-digit" })}
              <span className="editorial-game-detail-bento-suffix">
                {" "}
                {releaseDate.getFullYear()}
              </span>
            </p>
          </SpotlightCard>
        )}

        {/* Platforms — wide */}
        {game.platforms?.length > 0 && (
          <SpotlightCard className="editorial-game-detail-bento-cell editorial-game-detail-bento-cell--wide">
            <KickerLabel className="mb-3">{tEd("platforms")}</KickerLabel>
            <div className="flex flex-wrap gap-2">
              {game.platforms.map((p) => (
                <span key={p.id} className="editorial-game-detail-pill">
                  <Icon icon={getPlatformIcon(p.slug)} className="h-3 w-3 shrink-0" />
                  {p.abbreviation || p.name}
                </span>
              ))}
            </div>
          </SpotlightCard>
        )}

        {/* Developer / Publisher */}
        <SpotlightCard className="editorial-game-detail-bento-cell">
          <KickerLabel className="mb-3">Developer</KickerLabel>
          <p className="editorial-game-detail-bento-display editorial-game-detail-bento-display-sm">
            {developer}
          </p>
          {publisher && publisher !== developer && (
            <>
              <KickerLabel className="mt-3">Publisher</KickerLabel>
              <p className="editorial-game-detail-bento-display editorial-game-detail-bento-display-sm text-white/70">
                {publisher}
              </p>
            </>
          )}
        </SpotlightCard>

        {/* Genres — wide */}
        {game.genres.length > 0 && (
          <SpotlightCard className="editorial-game-detail-bento-cell editorial-game-detail-bento-cell--wide">
            <KickerLabel className="mb-3">Genres</KickerLabel>
            <div className="flex flex-wrap gap-2">
              {game.genres.map((g) => (
                <span
                  key={g.id}
                  className="editorial-game-detail-pill"
                  style={{
                    borderColor: "rgba(var(--accent-rgb), 0.35)",
                    background: "rgba(var(--accent-rgb), 0.08)",
                    color: "rgb(var(--accent-rgb))",
                  }}
                >
                  {g.name}
                </span>
              ))}
            </div>
          </SpotlightCard>
        )}
      </div>
    </section>
  );
}
