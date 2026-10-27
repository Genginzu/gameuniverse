"use client";

import { useTranslations } from "next-intl";
import { AppImage } from "@/components/ui/app-image";
import { useHorizontalWheelScroll } from "@/hooks/useHorizontalWheelScroll";
import type { GameDetails } from "@/types/game";

type GameScreenshot = GameDetails["media"]["screenshots"][number];

interface MediaScreenshotRailProps {
  screenshots: GameScreenshot[];
  /** Viewer index of the first rail screenshot (screenshots shown before it in the grid). */
  startIndex: number;
  total: number;
  gameTitle: string;
  onOpen: (viewerIndex: number) => void;
}

/**
 * Horizontal rail of the screenshots that do not fit the featured grid, so
 * every capture can be browsed inline (swipe on touch, wheel on mouse).
 */
export function MediaScreenshotRail({
  screenshots,
  startIndex,
  total,
  gameTitle,
  onOpen,
}: MediaScreenshotRailProps) {
  const t = useTranslations("gameDetails.editorial.mediaViewer");
  const railRef = useHorizontalWheelScroll<HTMLUListElement>();

  if (screenshots.length === 0) return null;

  return (
    <ul
      ref={railRef}
      aria-label={t("moreScreenshots")}
      className="editorial-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pointer-fine:snap-none md:-mx-8 md:px-8 lg:mx-0 lg:px-0"
    >
      {screenshots.map((shot, offset) => {
        const viewerIndex = startIndex + offset;
        return (
          <li key={shot.id} className="w-64 shrink-0 snap-start sm:w-72 lg:w-80">
            <button
              type="button"
              onClick={() => onOpen(viewerIndex)}
              aria-label={t("openImage", { index: viewerIndex + 1, total })}
              className="editorial-game-detail-media-tile block w-full cursor-zoom-in"
            >
              <AppImage
                src={shot.url}
                alt={shot.altText ?? `${gameTitle} screenshot`}
                fill
                sizes="(min-width: 1024px) 320px, 288px"
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
