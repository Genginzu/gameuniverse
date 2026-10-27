"use client";

/**
 * Section "About" : description + storyline en mise en page magazine.
 * Côté gauche : kicker numéroté + titre display, côté droit : lead en blanc
 * puis storyline empilés en une seule colonne.
 */

import { useTranslations } from "next-intl";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { GameDetails } from "@/types/game";
import { accentRich } from "../utils/accent-rich";

interface AboutSectionProps {
  game: GameDetails;
}

export function AboutSection({ game }: AboutSectionProps) {
  const tEd = useTranslations("gameDetails.editorial");

  if (!game.description && !game.storyline) return null;

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <div className="editorial-game-detail-section-grid">
        <div className="editorial-game-detail-section-heading">
          <KickerLabel className="mb-3">01 — {tEd("sections.about")}</KickerLabel>
          <h2>{tEd.rich("sections.aboutTitle", accentRich)}</h2>
        </div>
        <div className="editorial-game-detail-about-text">
          {game.description && (
            <p className="editorial-game-detail-about-lead">{game.description}</p>
          )}
          {game.storyline && <p>{game.storyline}</p>}
        </div>
      </div>
    </section>
  );
}
