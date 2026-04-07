"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { GameDetails } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";
import { getPlatformIcon } from "@/lib/utils/platform-icons";
import { Icon } from "@iconify/react";
import { GameDetailsTabs, TabType } from "./GameDetailsTabs";
import dynamic from "next/dynamic";

// Lazy load — sections en bas de page, non critiques au premier rendu
const SimilarGamesSection = dynamic(
  () => import("@/components/games/details/SimilarGamesSection").then((m) => m.SimilarGamesSection),
  { ssr: false }
);
const RecommendationSection = dynamic(
  () =>
    import("@/components/games/details/RecommendationSection").then((m) => m.RecommendationSection),
  { ssr: false }
);

interface GameDetailsMainContentProps {
  game: GameDetails;
  locale: string;
  colors: GameColors;
  formatReleaseDate: (dateString?: string) => string | null;
  getMetascoreColor: (score?: number) => string;
  formatPrice: (price: number, currency: string) => string;
}

export function GameDetailsMainContent({
  game,
  locale,
  colors,
  getMetascoreColor,
  formatPrice,
}: GameDetailsMainContentProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Utiliser les jeux similaires IGDB si disponibles, sinon fallback sur les recommandations algorithmiques
  const hasSimilarGames = game.similarGames && game.similarGames.some((sg) => sg.game !== null);

  return (
    <div className="min-w-0 flex-1">
      {/* Platforms */}
      {game.platforms?.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {game.platforms.map((platform) => {
            const platformIconName = getPlatformIcon(platform.slug);
            return (
              <Badge
                key={platform.id}
                variant="secondary"
                className="pointer-events-none inline-flex items-center gap-1.5 rounded-full border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 backdrop-blur-xs"
              >
                <Icon icon={platformIconName} className="h-3 w-3 shrink-0" />
                {platform.abbreviation || platform.name}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Title */}
      <h1 className="neon-text mb-4 text-2xl leading-tight font-bold text-white sm:mb-6 sm:text-3xl lg:text-5xl">
        {game.title}
      </h1>

      {/* Tabs right below title */}
      <GameDetailsTabs
        game={game}
        colors={colors}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        getMetascoreColor={getMetascoreColor}
        formatPrice={formatPrice}
      />

      {/* Similar games (IGDB) ou recommandations algorithmiques en fallback */}
      <div className="mt-12">
        {hasSimilarGames ? (
          <SimilarGamesSection similarGames={game.similarGames!} locale={locale} />
        ) : (
          <RecommendationSection gameSlug={game.slug} locale={locale} />
        )}
      </div>
    </div>
  );
}
