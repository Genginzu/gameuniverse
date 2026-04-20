"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { GameColors } from "@/lib/utils/game-utils";

interface GameHeroCoverProps {
  coverImage: string;
  title: string;
  metascore?: number;
  colors: GameColors;
  getMetascoreColor: (score?: number) => string;
}

export function GameHeroCover({
  coverImage,
  title,
  metascore,
  colors,
  getMetascoreColor,
}: GameHeroCoverProps) {
  return (
    <div className="sticky top-24">
      <div className="group relative mx-auto max-w-[320px]">
        <div
          className="absolute inset-0 scale-105 rounded-xl opacity-50 blur-xl"
          style={{
            background: `linear-gradient(to bottom right, ${colors.accent}20, ${colors.accent}10)`,
          }}
        />
        <div className="relative aspect-3/4 overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80 backdrop-blur-xs">
          <LazyImage
            src={coverImage}
            alt={title}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-105"
            sizes="320px"
            priority
            showSkeleton={true}
          />

          {metascore && metascore > 0 && (
            <div className="absolute top-4 right-4">
              <div
                className={`${getMetascoreColor(metascore)} rounded-full px-3 py-1 text-sm font-bold text-white shadow-lg`}
              >
                {metascore}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
