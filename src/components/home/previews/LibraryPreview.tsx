"use client";

import { useTranslations } from "next-intl";

import { GameCard } from "@/components/games/GameCard";
import type { GameSummary } from "@/types/game";
import type { HomeShowcaseGame } from "@/types/home";
import { PreviewPlaceholder } from "./PreviewFrame";
import { DEMO_LIBRARY_STATUSES, demoLibraryOverlay } from "./previewDemoData";

interface LibraryPreviewProps {
  /** Admin selection (status chosen in the admin). */
  showcase: HomeShowcaseGame[];
  /** Used with demo statuses when the admin selection is empty. */
  fallbackGames: GameSummary[];
}

function toItems(showcase: HomeShowcaseGame[], fallbackGames: GameSummary[]) {
  const limit = DEMO_LIBRARY_STATUSES.length;
  if (showcase.length > 0) {
    return showcase
      .slice(0, limit)
      .map(({ game, status }) => ({ game, overlay: demoLibraryOverlay(status) }));
  }
  return fallbackGames
    .slice(0, limit)
    .map((game, index) => ({ game, overlay: demoLibraryOverlay(DEMO_LIBRARY_STATUSES[index]) }));
}

/** Library grid excerpt: admin-picked games, or trending games with demo statuses. */
export function LibraryPreview({ showcase, fallbackGames }: LibraryPreviewProps) {
  const t = useTranslations("landing.previews.mockups");
  const items = toItems(showcase, fallbackGames);

  if (items.length === 0) {
    return <PreviewPlaceholder icon="mdi:bookshelf" label={t("empty")} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-lg font-semibold text-white">{t("libraryTitle")}</p>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {items.map(({ game, overlay }) => (
          <GameCard key={game.id} game={game} overlay={overlay} />
        ))}
      </div>
    </div>
  );
}
