"use client";

/**
 * Section "Editions" : versions du jeu (GOTY, Deluxe, etc).
 * Layout : heading magazine + grille de cards 3 cols (image + titre + desc).
 */

import Image from "next/image";
import { useTranslations } from "next-intl";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { GameDetails } from "@/types/game";
import { accentRich } from "../utils/accent-rich";

interface VersionsSectionProps {
  game: GameDetails;
}

export function VersionsSection({ game }: VersionsSectionProps) {
  const tEd = useTranslations("gameDetails.editorial");
  const versions = game.versions ?? [];
  if (versions.length === 0) return null;

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <div className="editorial-game-detail-section-grid">
        <div className="editorial-game-detail-section-heading">
          <KickerLabel className="mb-3">07 — {tEd("sections.editions")}</KickerLabel>
          <h2>{tEd.rich("sections.editionsTitle", accentRich)}</h2>
        </div>
        <div className="editorial-game-detail-card-grid editorial-game-detail-card-grid--three">
          {versions.map((version) => (
            <SpotlightCard key={version.id} className="editorial-game-detail-cover-card">
              {version.coverImageUrl && (
                <div className="editorial-game-detail-cover-card-img">
                  <Image
                    src={version.coverImageUrl}
                    alt={version.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 25vw, 50vw"
                  />
                </div>
              )}
              <div className="editorial-game-detail-cover-card-body">
                <h3 className="editorial-game-detail-cover-card-title">{version.title}</h3>
                {version.description && (
                  <p className="editorial-game-detail-cover-card-text">{version.description}</p>
                )}
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
