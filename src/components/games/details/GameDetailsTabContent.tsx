"use client";

import { GamePlaytime } from "../GamePlaytime";
import { GameAgeRatings } from "../GameAgeRatings";
import { GameVersions } from "../GameVersions";
import { GameDlcExtensions } from "../GameDlcExtensions";
import { GameMediaGallery } from "./GameMediaGallery";
import { GameStatsGrid } from "./GameStatsGrid";
import { GamePricingSection } from "./GamePricingSection";
import { PriceHistoryTab } from "./PriceHistoryTab";
import { GameReviewsTab } from "../reviews/GameReviewsTab";
import { GameDetailsTabLanguages } from "./GameDetailsTabLanguages";
import { GameDetailsTabMusic } from "./GameDetailsTabMusic";
import { GameDetails } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";
import { TabType } from "./GameDetailsTabs";

interface GameDetailsTabContentProps {
  game: GameDetails;
  colors: GameColors;
  activeTab: TabType;
  getMetascoreColor: (score?: number) => string;
  formatPrice: (price: number, currency: string) => string;
}

/** Renders the content panel for the currently active tab. */
export function GameDetailsTabContent({
  game,
  colors,
  activeTab,
  getMetascoreColor,
  formatPrice,
}: GameDetailsTabContentProps) {
  return (
    <div className="space-y-8">
      {activeTab === "overview" && (
        <GameDetailsTabOverview
          game={game}
          colors={colors}
          getMetascoreColor={getMetascoreColor}
          formatPrice={formatPrice}
        />
      )}

      {activeTab === "ageRatings" && (
        <GameAgeRatings ratings={game.ageRatings} accentColor={colors.accent} />
      )}

      {activeTab === "versions" && (
        <GameVersions versions={game.versions} accentColor={colors.accent} />
      )}

      {activeTab === "dlcExtensions" && (
        <GameDlcExtensions dlcExtensions={game.dlcExtensions ?? []} accentColor={colors.accent} />
      )}

      {activeTab === "reviews" && (
        <GameReviewsTab gameId={game.id} gameTitle={game.title} accentColor={colors.primary} />
      )}

      {activeTab === "playtime" && (
        <GamePlaytime playtime={game.playtime} accentColor={colors.accent} slug={game.slug} />
      )}

      {activeTab === "languages" && (
        <GameDetailsTabLanguages languages={game.languages} colors={colors} />
      )}

      {activeTab === "music" && <GameDetailsTabMusic music={game.music} colors={colors} />}

      {activeTab === "priceHistory" && (
        <PriceHistoryTab
          gameSlug={game.slug}
          currentPrice={game.pricing?.[0]?.price}
          colors={{ primary: colors.primary, secondary: colors.secondary }}
        />
      )}
    </div>
  );
}

/** Overview tab: description, stats grid, pricing, media gallery. */
function GameDetailsTabOverview({
  game,
  colors,
  getMetascoreColor,
  formatPrice,
}: {
  game: GameDetails;
  colors: GameColors;
  getMetascoreColor: (score?: number) => string;
  formatPrice: (price: number, currency: string) => string;
}) {
  return (
    <>
      {/* Description */}
      {game.description && (
        <p className="max-w-3xl text-base leading-relaxed text-white">{game.description}</p>
      )}

      {/* Stats grid */}
      <GameStatsGrid
        game={game}
        colors={colors}
        getMetascoreColor={getMetascoreColor}
        formatPrice={formatPrice}
      />

      {/* Pricing / stores */}
      <GamePricingSection pricing={game.pricing} colors={colors} formatPrice={formatPrice} />

      {/* Media gallery */}
      <GameMediaGallery media={game.media} gameTitle={game.title} />
    </>
  );
}
