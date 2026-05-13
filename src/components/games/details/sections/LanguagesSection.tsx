"use client";

/**
 * Section "Languages" : table responsive avec checkmarks pour Interface,
 * Audio, Subtitles. Layout magazine (heading rail à gauche, table à droite).
 */

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { GameDetails } from "@/types/game";
import { renderAccentSegments } from "../utils/render-accent-segments";

interface LanguagesSectionProps {
  game: GameDetails;
}

export function LanguagesSection({ game }: LanguagesSectionProps) {
  const tEd = useTranslations("gameDetails.editorial");
  const languages = game.languages ?? [];

  if (languages.length === 0) return null;

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <div className="editorial-game-detail-section-grid">
        <div className="editorial-game-detail-section-heading">
          <KickerLabel className="mb-3">04 — {tEd("sections.languages")}</KickerLabel>
          <h2>{renderAccentSegments(tEd("sections.languagesTitle"))}</h2>
          <p className="editorial-game-detail-section-heading-meta">
            {tEd("sections.languagesSupported", { count: languages.length })}
          </p>
        </div>
        <div>
          <SpotlightCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="editorial-game-detail-lang-table">
                <thead>
                  <tr>
                    <th>{tEd("languages.language")}</th>
                    <th className="center">{tEd("languages.interface")}</th>
                    <th className="center">{tEd("languages.audio")}</th>
                    <th className="center">{tEd("languages.subtitles")}</th>
                  </tr>
                </thead>
                <tbody>
                  {languages.map((lang) => (
                    <tr key={lang.code}>
                      <td>{lang.name}</td>
                      <td className="center">{lang.hasInterface ? <Check /> : <Dash />}</td>
                      <td className="center">{lang.hasAudio ? <Check /> : <Dash />}</td>
                      <td className="center">{lang.hasSubtitles ? <Check /> : <Dash />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}

function Check() {
  return (
    <Icon
      icon="lucide:check"
      className="editorial-game-detail-lang-check mx-auto h-4 w-4"
      aria-label="yes"
    />
  );
}

function Dash() {
  return (
    <span className="editorial-game-detail-lang-dash" aria-label="no">
      —
    </span>
  );
}
