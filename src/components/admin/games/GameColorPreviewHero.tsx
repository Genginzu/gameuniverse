"use client";


import { Users, Calendar, Globe } from "lucide-react";
import type { GameColors } from "@/lib/utils/game-utils";
import { Icon } from "@iconify/react";

interface PreviewPriceBadge {
  storeName: string;
  price: string;
  platform: string;
}

interface PreviewHeroProps {
  colors: GameColors;
  title: string;
  coverUrl: string;
  backgroundUrl: string;
  description: string;
  genres: { id: string; name: string }[];
  developers: string[];
  publishers: string[];
  formattedDate: string | null;
  prices: PreviewPriceBadge[];
  t: (key: string) => string;
}

/**
 * Hero section of the color preview, matching the real GameHeroSection layout:
 * background image + gradient, cover 3/4 on the left, info on the right.
 */
export function GameColorPreviewHero({
  colors,
  title,
  coverUrl,
  backgroundUrl,
  description,
  genres,
  developers,
  publishers,
  formattedDate,
  prices,
  t,
}: PreviewHeroProps) {
  return (
    <div className="relative overflow-hidden" style={{ minHeight: 220 }}>
      {/* Background image */}
      {backgroundUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={backgroundUrl}
            alt=""
            className="h-full w-full object-cover object-center"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* Gradient overlay matching GameHeroSection */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(to bottom, ${colors.backgroundColor}20 0%, ${colors.backgroundColor}60 40%, ${colors.backgroundColor}90 70%, ${colors.backgroundColor} 100%)`,
        }}
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, ${colors.backgroundColor}40 70%, ${colors.backgroundColor}80 100%)`,
        }}
      />

      {/* Content: cover left, info right */}
      <div className="relative z-10 flex items-start gap-5 p-5">
        {/* Cover (aspect 3/4) */}
        <div className="flex-shrink-0">
          {coverUrl ? (
            <div className="relative aspect-[3/4] w-24 overflow-hidden rounded-lg border border-slate-700 bg-slate-800/80">
              <img
                src={coverUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="flex aspect-[3/4] w-24 items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-800/50">
              <Icon icon="fa:image" className="h-5 w-5 text-slate-500"  />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 pt-1">
          {/* Genre badges */}
          {genres.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {genres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full border border-slate-600 bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-300 backdrop-blur-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3
            className="mb-2 text-xl font-bold leading-tight drop-shadow-lg"
            style={{ color: colors.textColor }}
          >
            {title || (
              <span className="italic opacity-40">{t("titlePlaceholder") ?? "Titre du jeu"}</span>
            )}
          </h3>

          {/* Metadata line: developers, publishers, date */}
          <div
            className="mb-3 flex flex-wrap items-center gap-4 text-xs"
            style={{ color: colors.labelColor }}
          >
            {developers.map((name) => (
              <span key={`dev-${name}`} className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" style={{ color: colors.accent }} />
                {name}
              </span>
            ))}
            {publishers.map((name) => (
              <span key={`pub-${name}`} className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" style={{ color: colors.accent }} />
                {name}
              </span>
            ))}
            {formattedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" style={{ color: colors.accent }} />
                {formattedDate}
              </span>
            )}
          </div>

          {/* Description (truncated) */}
          {description && (
            <p
              className="line-clamp-2 text-sm leading-relaxed drop-shadow-sm"
              style={{ color: colors.textColor }}
            >
              {description}
            </p>
          )}

          {/* Pricing badges matching GamePricingSection */}
          {prices.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {prices.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md border px-3 py-1.5 backdrop-blur-sm"
                  style={{
                    backgroundColor: `${colors.backgroundColor}e6`,
                    borderColor: `${colors.backgroundColor}80`,
                  }}
                >
                  <span className="text-[11px]" style={{ color: colors.labelColor }}>
                    {p.storeName}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: colors.accent }}>
                    {p.price}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
