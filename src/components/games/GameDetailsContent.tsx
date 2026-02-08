"use client";

import { useState } from "react";
import { GameDetails } from "@/types/game";
import {
  getGameColors,
  formatReleaseDate as formatReleaseDateUtil,
  formatPrice as formatPriceUtil,
  getMetascoreColor as getMetascoreColorUtil,
} from "@/lib/utils/game-utils";
import { GameHeroSection } from "./details/GameHeroSection";
import { GameOverviewSection } from "./details/GameOverviewSection";
import { GameDetailsTabs, TabType } from "./details/GameDetailsTabs";
import { GamePricingSection } from "./details/GamePricingSection";

interface GameDetailsProps {
  game: GameDetails;
  locale: string;
}

/**
 * GameDetailsContent - Main component for displaying detailed game information.
 *
 * This component composes several sub-components:
 * - GameHeroSection: Hero section with background image, cover, and navigation
 * - GameOverviewSection: Overview info cards (developer, publisher, etc.)
 * - GameDetailsTabs: Tab navigation with media, age ratings, versions, etc.
 * - GamePricingSection: Pricing cards with store links
 *
 * **Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.8, 14.9**
 */
export function GameDetailsContent({ game, locale }: GameDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("media");
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Get color scheme based on game title and genres
  const colors = getGameColors(
    game.title,
    game.genres.map((g) => g.name)
  );

  // Locale-aware formatting functions
  const formatReleaseDate = (dateString?: string) => formatReleaseDateUtil(dateString, locale);

  const formatPrice = (price: number, currency: string) => formatPriceUtil(price, currency, locale);

  const getMetascoreColor = (score?: number) => getMetascoreColorUtil(score);

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: game.backgroundColor || "#0f172a",
      }}
    >
      {/* Hero Section with background image */}
      <GameHeroSection
        game={game}
        locale={locale}
        colors={colors}
        isWishlisted={isWishlisted}
        onWishlistToggle={handleWishlistToggle}
        formatReleaseDate={formatReleaseDate}
        getMetascoreColor={getMetascoreColor}
      />

      {/* Pricing Section - positioned within hero sticky area */}
      <div className="container relative z-10 mx-auto px-4">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <GamePricingSection
                pricing={game.pricing}
                colors={colors}
                formatPrice={formatPrice}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content - Full width */}
      <div className="container relative z-10 mx-auto px-4 pb-16">
        <div className="space-y-12">
          {/* Overview Section */}
          <GameOverviewSection
            game={game}
            colors={colors}
            formatReleaseDate={formatReleaseDate}
            getMetascoreColor={getMetascoreColor}
          />

          {/* Tabs Section */}
          <GameDetailsTabs
            game={game}
            colors={colors}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>
    </div>
  );
}
