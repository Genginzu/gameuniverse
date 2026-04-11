"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { GameDetails } from "@/types/game";
import { GameColors, getContrastTextColor } from "@/lib/utils/game-utils";
import { useGameLibraryStatus } from "@/hooks/useGameLibraryStatus";
import { GameDetailsSidebarMeta } from "./GameDetailsSidebarMeta";

interface GameDetailsSidebarProps {
  game: GameDetails;
  locale: string;
  colors: GameColors;
  formatReleaseDate: (dateString?: string) => string | null;
  formatPrice: (price: number, currency: string) => string;
}

export function GameDetailsSidebar({ game, colors, formatReleaseDate }: GameDetailsSidebarProps) {
  const t = useTranslations();
  const { inLibrary, loading, adding, addToLibrary, removeFromLibrary } = useGameLibraryStatus(
    game.id
  );

  const handleLibraryToggle = async () => {
    if (inLibrary) {
      await removeFromLibrary();
    } else {
      await addToLibrary();
    }
  };

  const isProcessing = loading || adding;

  return (
    <div className="w-full shrink-0 lg:w-[320px]">
      <div className="sticky top-24 space-y-4">
        {/* Cover image */}
        <div className="group relative mx-auto max-w-[280px] overflow-hidden rounded-2xl lg:max-w-none">
          <div className="relative aspect-square">
            <LazyImage
              src={game.media.coverImage}
              alt={game.title}
              fill
              className="rounded-2xl object-contain transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 1024px) 280px, 320px"
              priority
              showSkeleton={true}
            />
          </div>
        </div>

        {/* Library toggle — accent color CTA */}
        <button
          onClick={handleLibraryToggle}
          disabled={isProcessing}
          className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/20 py-3 text-sm font-semibold shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] active:scale-[0.98] disabled:opacity-60"
          style={{
            backgroundColor: inLibrary ? "rgba(255,255,255,0.08)" : `${colors.accent}CC`,
            borderColor: inLibrary ? colors.accent : `${colors.accent}60`,
            color: inLibrary ? colors.accent : getContrastTextColor(colors.accent),
          }}
        >
          {isProcessing ? (
            <Icon icon="svg-spinners:ring-resize" className="h-4 w-4" />
          ) : (
            <Icon icon="lucide:heart" className={`h-4 w-4 ${inLibrary ? "fill-current" : ""}`} />
          )}
          {inLibrary ? t("game.removeFromLibrary") : t("game.addToLibrary")}
        </button>

        {/* Share button */}
        <button className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-300 shadow-lg shadow-black/10 backdrop-blur-xl transition-colors hover:bg-white/10">
          <Icon icon="lucide:share-2" className="h-4 w-4" />
          {t("common.share")}
        </button>

        {/* Meta info: devs, publishers, date, platforms, genres */}
        <GameDetailsSidebarMeta game={game} colors={colors} formatReleaseDate={formatReleaseDate} />
      </div>
    </div>
  );
}
