"use client";

import Image from "next/image";
import type { GameColors } from "@/lib/utils/game-utils";
import { Icon } from "@iconify/react";
import { GameColorPreviewHeroInfo } from "./GameColorPreviewHeroInfo";

interface PreviewPriceBadge { storeName: string; price: string; platform: string; }

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
      {backgroundUrl && (
        <div className="absolute inset-0 z-0">
          <Image src={backgroundUrl} alt="" fill className="object-cover object-center" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
      <div
        className="absolute inset-0 z-1"
        style={{
          background: `linear-gradient(to bottom, ${colors.backgroundColor}20 0%, ${colors.backgroundColor}60 40%, ${colors.backgroundColor}90 70%, ${colors.backgroundColor} 100%)`,
        }}
      />
      <div
        className="absolute inset-0 z-1"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, ${colors.backgroundColor}40 70%, ${colors.backgroundColor}80 100%)`,
        }}
      />

      <div className="relative z-10 flex items-start gap-5 p-5">
        <div className="shrink-0">
          {coverUrl ? (
            <div className="relative aspect-3/4 w-24 overflow-hidden rounded-lg border border-slate-700 bg-slate-800/80">
              <Image src={coverUrl} alt="" fill className="object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          ) : (
            <div className="flex aspect-3/4 w-24 items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-800/50">
              <Icon icon="fa:image" className="h-5 w-5 text-slate-500" />
            </div>
          )}
        </div>
        <GameColorPreviewHeroInfo
          colors={colors}
          title={title}
          description={description}
          genres={genres}
          developers={developers}
          publishers={publishers}
          formattedDate={formattedDate}
          prices={prices}
          t={t}
        />
      </div>
    </div>
  );
}
