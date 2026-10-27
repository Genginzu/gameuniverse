"use client";

import { useTranslations } from "next-intl";
import { useHorizontalWheelScroll } from "@/hooks/useHorizontalWheelScroll";
import type { GameDetails } from "@/types/game";
import { MediaVideoCard } from "./MediaVideoCard";

type GameVideo = GameDetails["media"]["videos"][number];

interface MediaVideoRailProps {
  videos: GameVideo[];
  /** Viewer index of the first video (screenshots come first in the viewer). */
  startIndex: number;
  fallbackThumbnail?: string;
  onOpen: (viewerIndex: number) => void;
}

/**
 * Horizontal rail of every game video, browsable inline (swipe on touch,
 * wheel on mouse).
 */
export function MediaVideoRail({ videos, startIndex, fallbackThumbnail, onOpen }: MediaVideoRailProps) {
  const t = useTranslations("gameDetails.editorial.mediaViewer");
  const railRef = useHorizontalWheelScroll<HTMLUListElement>();

  if (videos.length === 0) return null;

  return (
    <ul
      ref={railRef}
      aria-label={t("moreVideos")}
      className="editorial-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pointer-fine:snap-none md:-mx-8 md:px-8 lg:mx-0 lg:px-0"
    >
      {videos.map((video, offset) => (
        <li key={video.id} className="w-72 shrink-0 snap-start sm:w-80 lg:w-96">
          <MediaVideoCard
            video={video}
            fallbackThumbnail={fallbackThumbnail}
            sizes="(min-width: 1024px) 384px, 320px"
            onOpen={() => onOpen(startIndex + offset)}
          />
        </li>
      ))}
    </ul>
  );
}
