"use client";

import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { Icon } from "@iconify/react";
import { GameDetails } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";
import { getPlatformIcon } from "@/lib/utils/platform-icons";
import { GamePricingSection } from "./GamePricingSection";
import { GameHeroNav } from "./GameHeroNav";
import { GameHeroCover } from "./GameHeroCover";
import { GameHeroMetadata } from "./GameHeroMetadata";

interface GameHeroSectionProps {
  game: GameDetails;
  locale: string;
  colors: GameColors;
  isWishlisted: boolean;
  isWishlistToggling?: boolean;
  onWishlistToggle: () => void;
  formatReleaseDate: (dateString?: string) => string | null;
  getMetascoreColor: (score?: number) => string;
  formatPrice: (price: number, currency: string) => string;
}

export function GameHeroSection({
  game,
  locale: _locale,
  colors,
  isWishlisted,
  isWishlistToggling = false,
  onWishlistToggle,
  formatReleaseDate,
  getMetascoreColor,
  formatPrice,
}: GameHeroSectionProps) {
  return (
    <div className="relative">
      <GameHeroNav
        isWishlisted={isWishlisted}
        isWishlistToggling={isWishlistToggling}
        onWishlistToggle={onWishlistToggle}
      />

      {/* Background image */}
      {game.media.backgroundImage && game.media.backgroundImage !== "none" && (
        <div className="absolute inset-0 z-0 h-[60vh] overflow-hidden">
          <LazyImage
            src={game.media.backgroundImage}
            alt={`${game.title} background`}
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
            showSkeleton={true}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${colors.backgroundColor}20 0%, ${colors.backgroundColor}60 40%, ${colors.backgroundColor}90 70%, ${colors.backgroundColor} 100%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, transparent 0%, ${colors.backgroundColor}40 70%, ${colors.backgroundColor}80 100%)`,
            }}
          />
        </div>
      )}

      <div className="relative z-10 container mx-auto flex min-h-[60vh] items-center px-4 pt-16 pb-4">
        <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <GameHeroCover
              coverImage={game.media.coverImage ?? ""}
              title={game.title}
              metascore={game.metascore}
              colors={colors}
              getMetascoreColor={getMetascoreColor}
            />
          </div>

          <div className="lg:col-span-8">
            <div className="mb-4">
              {game.platforms?.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {game.platforms.map((platform) => (
                    <Badge
                      key={platform.id}
                      variant="secondary"
                      className="pointer-events-none inline-flex items-center gap-1.5 border-slate-600 bg-slate-800/80 text-slate-300 backdrop-blur-xs"
                    >
                      <Icon icon={getPlatformIcon(platform.slug)} className="h-3 w-3 shrink-0" />
                      {platform.abbreviation || platform.name}
                    </Badge>
                  ))}
                </div>
              )}

              <h1
                className="neon-text mb-4 text-4xl leading-tight font-bold drop-shadow-lg lg:text-6xl"
                style={{ color: colors.textColor }}
              >
                {game.title}
              </h1>

              <GameHeroMetadata game={game} colors={colors} formatReleaseDate={formatReleaseDate} />

              {game.description && (
                <p
                  className="max-w-4xl text-lg leading-relaxed drop-shadow-xs"
                  style={{ color: colors.textColor }}
                >
                  {game.description}
                </p>
              )}

              <GamePricingSection
                pricing={game.pricing}
                colors={colors}
                formatPrice={formatPrice}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
