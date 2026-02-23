"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import Link from "next/link";
import { ArrowLeft, Calendar, Users, Globe, Heart, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { GameDetails } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";
import { GamePricingSection } from "./GamePricingSection";

interface GameHeroSectionProps {
  game: GameDetails;
  locale: string;
  colors: GameColors;
  isWishlisted: boolean;
  onWishlistToggle: () => void;
  formatReleaseDate: (dateString?: string) => string | null;
  getMetascoreColor: (score?: number) => string;
  formatPrice: (price: number, currency: string) => string;
}

export function GameHeroSection({
  game,
  locale,
  colors,
  isWishlisted,
  onWishlistToggle,
  formatReleaseDate,
  getMetascoreColor,
  formatPrice,
}: GameHeroSectionProps) {
  const t = useTranslations();

  return (
    <div className="relative">
      {/* Floating navigation buttons */}
      <div className="absolute left-0 right-0 top-0 z-20 px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href={`/${locale}/games`}>
            <Button
              variant="ghost"
              size="sm"
              className="bg-slate-900/60 text-slate-300 backdrop-blur-sm hover:bg-slate-900/80 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="bg-slate-900/60 text-slate-300 backdrop-blur-sm hover:bg-slate-900/80 hover:text-white"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`bg-slate-900/60 backdrop-blur-sm hover:bg-slate-900/80 hover:text-white ${isWishlisted ? "text-red-400" : "text-slate-300"}`}
              onClick={onWishlistToggle}
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Background image - only for hero section */}
      {game.media.backgroundImage && (
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
          {/* Overlay gradient for ambiance */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${colors.backgroundColor}20 0%, ${colors.backgroundColor}60 40%, ${colors.backgroundColor}90 70%, ${colors.backgroundColor} 100%)`,
            }}
          />
          {/* Vignette effect for ambiance */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, transparent 0%, ${colors.backgroundColor}40 70%, ${colors.backgroundColor}80 100%)`,
            }}
          />
        </div>
      )}

      <div className="container relative z-10 mx-auto flex min-h-[60vh] items-center px-4 pb-4 pt-16">
        <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Cover and actions - Left column */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              {/* Main cover */}
              <div className="group relative mx-auto max-w-[320px]">
                <div
                  className="absolute inset-0 scale-105 rounded-xl opacity-50 blur-xl"
                  style={{
                    background: `linear-gradient(to bottom right, ${colors.accent}20, ${colors.accent}10)`,
                  }}
                />
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80 backdrop-blur-sm">
                  <LazyImage
                    src={game.media.coverImage}
                    alt={game.title}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                    sizes="320px"
                    priority
                    showSkeleton={true}
                  />

                  {/* Metascore badge */}
                  {game.metascore && (
                    <div className="absolute right-4 top-4">
                      <div
                        className={`${getMetascoreColor(game.metascore)} rounded-full px-3 py-1 text-sm font-bold text-white shadow-lg`}
                      >
                        {game.metascore}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main content - Right column */}
          <div className="lg:col-span-8">
            {/* Game header */}
            <div className="mb-4">
              {/* Genres */}
              {game.genres.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {game.genres.slice(0, 3).map((genre) => (
                    <Badge
                      key={genre.id}
                      variant="secondary"
                      className="pointer-events-none border-slate-600 bg-slate-800/80 text-slate-300 backdrop-blur-sm"
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1
                className="neon-text mb-4 text-4xl font-bold leading-tight drop-shadow-lg lg:text-6xl"
                style={{ color: colors.textColor }}
              >
                {game.title}
              </h1>

              {/* Metadata */}
              <div className="mb-6 flex flex-wrap gap-6" style={{ color: colors.labelColor }}>
                {game.companies?.developers?.length > 0 ? (
                  game.companies.developers.map((dev) => (
                    <div key={dev.id} className="flex items-center gap-2">
                      <Users className="h-4 w-4" style={{ color: colors.accent }} />
                      <span>{dev.name}</span>
                    </div>
                  ))
                ) : game.developer ? (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color: colors.accent }} />
                    <span>{game.developer}</span>
                  </div>
                ) : null}
                {game.companies?.publishers?.length > 0 ? (
                  game.companies.publishers
                    .filter((pub) => !game.companies.developers?.some((dev) => dev.id === pub.id))
                    .map((pub) => (
                      <div key={pub.id} className="flex items-center gap-2">
                        <Globe className="h-4 w-4" style={{ color: colors.accent }} />
                        <span>{pub.name}</span>
                      </div>
                    ))
                ) : game.publisher && game.publisher !== game.developer ? (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" style={{ color: colors.accent }} />
                    <span>{game.publisher}</span>
                  </div>
                ) : null}
                {game.releaseDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" style={{ color: colors.accent }} />
                    <span>{formatReleaseDate(game.releaseDate)}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {game.description && (
                <p
                  className="max-w-4xl text-lg leading-relaxed drop-shadow-sm"
                  style={{ color: colors.textColor }}
                >
                  {game.description}
                </p>
              )}

              {/* Pricing - inline after description */}
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
