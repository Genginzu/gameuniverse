"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { AppImage } from "@/components/ui/app-image";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import { cn } from "@/lib/utils";
import { buildYouTubeThumbnail } from "@/lib/utils/youtube";
import type { GameDetails } from "@/types/game";

type GameVideo = GameDetails["media"]["videos"][number];

interface MediaVideoCardProps {
  video: GameVideo;
  fallbackThumbnail?: string;
  sizes: string;
  onOpen: () => void;
  className?: string;
}

function formatDuration(seconds?: number): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Video thumbnail card with accent play button; a click opens the media viewer. */
export function MediaVideoCard({ video, fallbackThumbnail, sizes, onOpen, className }: MediaVideoCardProps) {
  const t = useTranslations("gameDetails.editorial.mediaViewer");
  const thumb = buildYouTubeThumbnail(video.url, video.thumbnailUrl ?? fallbackThumbnail);
  const duration = formatDuration(video.duration);

  return (
    <SpotlightCard className={cn("editorial-game-detail-video-card", className)}>
      {thumb && <AppImage src={thumb} alt="" fill sizes={sizes} />}
      <div className="editorial-game-detail-video-overlay" aria-hidden="true" />
      <div className="editorial-game-detail-video-play" aria-hidden="true">
        <span>
          <Icon icon="lucide:play" className="h-6 w-6 fill-current" />
        </span>
      </div>
      <div className="editorial-game-detail-video-meta">
        <p className="editorial-game-detail-video-title">{video.title}</p>
        {duration && (
          <span className="editorial-game-detail-pill border-white/20 bg-black/40 text-white">
            {duration}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onOpen}
        aria-label={t("playVideo", { title: video.title })}
        className="absolute inset-0 z-10 cursor-pointer"
      />
    </SpotlightCard>
  );
}
