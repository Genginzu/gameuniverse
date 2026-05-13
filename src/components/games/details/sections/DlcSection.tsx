"use client";

/**
 * Section "Expansions" : DLC + extensions.
 * Cards 2 cols avec image + meta date + nom + résumé.
 */

import Image from "next/image";
import { useTranslations } from "next-intl";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { GameDetails } from "@/types/game";
import { renderAccentSegments } from "../utils/render-accent-segments";

interface DlcSectionProps {
  game: GameDetails;
  locale: string;
}

export function DlcSection({ game, locale }: DlcSectionProps) {
  const tEd = useTranslations("gameDetails.editorial");
  const dlc = game.dlcExtensions ?? [];
  if (dlc.length === 0) return null;

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <div className="editorial-game-detail-section-grid">
        <div className="editorial-game-detail-section-heading">
          <KickerLabel className="mb-3">08 — {tEd("sections.expansions")}</KickerLabel>
          <h2>{renderAccentSegments(tEd("sections.expansionsTitle"))}</h2>
        </div>
        <div className="editorial-game-detail-card-grid">
          {dlc.map((item) => (
            <SpotlightCard key={item.id} className="editorial-game-detail-cover-card">
              {item.coverImageUrl && (
                <div className="editorial-game-detail-cover-card-img">
                  <Image
                    src={item.coverImageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                  <div className="editorial-game-detail-cover-card-meta">
                    {item.releaseDate && (
                      <KickerLabel className="text-white/80">
                        {dateFormatter.format(new Date(item.releaseDate))}
                      </KickerLabel>
                    )}
                    <p className="editorial-game-detail-cover-card-title mt-1">{item.name}</p>
                  </div>
                </div>
              )}
              {item.summary && (
                <div className="editorial-game-detail-cover-card-body">
                  <p className="editorial-game-detail-cover-card-text">{item.summary}</p>
                </div>
              )}
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
