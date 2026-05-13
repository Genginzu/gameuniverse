"use client";

/**
 * Section "Age ratings" : badges PEGI/ESRB grand format avec descriptors.
 * Layout magazine (heading rail à gauche, cartes à droite en grille 2 col).
 */

import Image from "next/image";
import { useTranslations } from "next-intl";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { GameDetails } from "@/types/game";
import { renderAccentSegments } from "../utils/render-accent-segments";

interface AgeRatingsSectionProps {
  game: GameDetails;
}

export function AgeRatingsSection({ game }: AgeRatingsSectionProps) {
  const tEd = useTranslations("gameDetails.editorial");
  const ratings = game.ageRatings ?? (game.ageRating ? [game.ageRating] : []);
  if (ratings.length === 0) return null;

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <div className="editorial-game-detail-section-grid">
        <div className="editorial-game-detail-section-heading">
          <KickerLabel className="mb-3">03 — {tEd("sections.ageRatings")}</KickerLabel>
          <h2>{renderAccentSegments(tEd("sections.ageRatingsTitle"))}</h2>
        </div>
        <div className="editorial-game-detail-rating-grid">
          {ratings.map((rating, index) => (
            <SpotlightCard
              key={`${rating.systemCode ?? rating.system}-${rating.ratingCode ?? rating.rating}-${index}`}
              className="editorial-game-detail-rating-card"
            >
              <div className="editorial-game-detail-rating-row">
                <div className="editorial-game-detail-rating-badge">
                  {rating.iconUrl ? (
                    <div className="relative h-16 w-12">
                      <Image
                        src={rating.iconUrl}
                        alt={rating.rating}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div>
                      <span className="editorial-game-detail-rating-badge-system">
                        {rating.system}
                      </span>
                      <span className="editorial-game-detail-rating-badge-rating">
                        {rating.minimumAge !== undefined && rating.minimumAge !== null
                          ? `${rating.minimumAge}+`
                          : (rating.ratingCode ?? rating.rating)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="editorial-game-detail-bento-display editorial-game-detail-bento-display-sm">
                    {rating.rating}
                  </p>
                  <KickerLabel className="mt-1">{rating.system}</KickerLabel>
                  {rating.contentDescriptors && rating.contentDescriptors.length > 0 && (
                    <>
                      <KickerLabel className="mt-3">
                        {tEd("ageRating.contentDescriptors")}
                      </KickerLabel>
                      <ul className="editorial-game-detail-rating-descriptors">
                        {rating.contentDescriptors.map((d, idx) => (
                          <li
                            key={`${d.code}-${idx}`}
                            className="editorial-game-detail-rating-descriptor"
                            title={d.description || undefined}
                          >
                            {d.name || d.code}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
