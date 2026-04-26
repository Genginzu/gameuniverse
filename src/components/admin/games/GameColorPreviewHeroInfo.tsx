"use client";

import type { GameColors } from "@/lib/utils/game-utils";
import { Icon } from "@iconify/react";

interface PreviewPriceBadge {
  storeName: string;
  price: string;
  platform: string;
}

export function GameColorPreviewHeroInfo({
  colors,
  title,
  description,
  genres,
  developers,
  publishers,
  formattedDate,
  prices,
  t,
}: {
  colors: GameColors;
  title: string;
  description: string;
  genres: { id: string; name: string }[];
  developers: string[];
  publishers: string[];
  formattedDate: string | null;
  prices: PreviewPriceBadge[];
  t: (key: string) => string;
}) {
  return (
    <div className="min-w-0 flex-1 pt-1">
      {genres.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {genres.map((genre) => (
            <span
              key={genre.id}
              className="rounded-full border border-slate-600 bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-300 backdrop-blur-xs"
            >
              {genre.name}
            </span>
          ))}
        </div>
      )}
      <h3
        className="mb-2 text-xl leading-tight font-bold drop-shadow-lg"
        style={{ color: colors.textColor }}
      >
        {title || (
          <span className="italic opacity-40">{t("titlePlaceholder") ?? "Titre du jeu"}</span>
        )}
      </h3>
      <div
        className="mb-3 flex flex-wrap items-center gap-4 text-xs"
        style={{ color: colors.labelColor }}
      >
        {developers.map((name) => (
          <span key={`dev-${name}`} className="flex items-center gap-1.5">
            <Icon icon="lucide:users" className="h-3.5 w-3.5" style={{ color: colors.accent }} />
            {name}
          </span>
        ))}
        {publishers.map((name) => (
          <span key={`pub-${name}`} className="flex items-center gap-1.5">
            <Icon icon="lucide:globe" className="h-3.5 w-3.5" style={{ color: colors.accent }} />
            {name}
          </span>
        ))}
        {formattedDate && (
          <span className="flex items-center gap-1.5">
            <Icon icon="lucide:calendar" className="h-3.5 w-3.5" style={{ color: colors.accent }} />
            {formattedDate}
          </span>
        )}
      </div>
      {description && (
        <p
          className="line-clamp-2 text-sm leading-relaxed drop-shadow-xs"
          style={{ color: colors.textColor }}
        >
          {description}
        </p>
      )}
      {prices.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {prices.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md border px-3 py-1.5 backdrop-blur-xs"
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
  );
}
