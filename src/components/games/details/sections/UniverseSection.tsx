"use client";

/**
 * Section "Univers & gameplay": technical sheet (genres, franchises, themes,
 * modes, perspectives, engines), multiplayer capabilities and websites.
 */

import { useTranslations } from "next-intl";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { GameDetails } from "@/types/game";
import { accentRich } from "../utils/accent-rich";
import { ClassificationCard, hasClassification } from "../metadata/ClassificationCard";
import { MultiplayerCard } from "../metadata/MultiplayerCard";
import { WebsitesCard } from "../metadata/WebsitesCard";
import { summarizeMultiplayer } from "@/lib/utils/multiplayerSummary";

interface UniverseSectionProps {
  game: GameDetails;
}

export function UniverseSection({ game }: UniverseSectionProps) {
  const tEd = useTranslations("gameDetails.editorial");
  const metadata = game.metadata;

  if (!metadata) return null;
  const genres = game.genres ?? [];
  const hasMultiplayer = summarizeMultiplayer(metadata.multiplayerModes).capabilities.length > 0;
  if (!hasClassification(metadata, genres) && !hasMultiplayer && metadata.websites.length === 0) {
    return null;
  }

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <div className="editorial-game-detail-section-grid">
        <div className="editorial-game-detail-section-heading">
          <KickerLabel className="mb-3">03 — {tEd("sections.universe")}</KickerLabel>
          <h2>{tEd.rich("sections.universeTitle", accentRich)}</h2>
        </div>
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <ClassificationCard metadata={metadata} genres={genres} />
          <MultiplayerCard modes={metadata.multiplayerModes} />
          <WebsitesCard websites={metadata.websites} />
        </div>
      </div>
    </section>
  );
}
