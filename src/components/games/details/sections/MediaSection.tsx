"use client";

/**
 * Section "Media" : screenshots + videos en mise en page asymétrique.
 *
 * Layout : 1 grand pavé "featured" (col-span-2 row-span-2) + grille
 * compacte 2x2 pour les autres screenshots. Les captures restantes défilent
 * dans un rail horizontal (`MediaScreenshotRail`) sous la grille, suivies
 * du rail de toutes les vidéos (`MediaVideoRail`).
 *
 * Cliquer sur une capture ou une vidéo ouvre `MediaLightbox`, qui enchaîne
 * toutes les captures puis toutes les vidéos sans refermer la vue agrandie.
 */

import { useState } from "react";
import { AppImage } from "@/components/ui/app-image";
import { useTranslations } from "next-intl";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { buildYouTubeThumbnail, extractYouTubeVideoId } from "@/lib/utils/youtube";
import type { GameDetails, GameMediaViewerItem } from "@/types/game";
import { accentRich } from "../utils/accent-rich";
import { MediaLightbox } from "./MediaLightbox";
import { MediaScreenshotRail } from "./MediaScreenshotRail";
import { MediaVideoRail } from "./MediaVideoRail";

interface MediaSectionProps {
  game: GameDetails;
}

/** Screenshots shown next to the featured one; the others go to the rail. */
const GRID_SIDE_SHOTS = 2;

type GameVideo = GameDetails["media"]["videos"][number];

/** Deduplicates videos by YouTube video id (handles URL variations). */
function dedupeVideos(videos: GameVideo[]): GameVideo[] {
  return videos.filter((video, index, self) => {
    const videoId = extractYouTubeVideoId(video.url);
    if (!videoId) return true;
    return index === self.findIndex((v) => extractYouTubeVideoId(v.url) === videoId);
  });
}

function buildViewerItems(game: GameDetails, videos: GameVideo[]): GameMediaViewerItem[] {
  const images: GameMediaViewerItem[] = (game.media.screenshots ?? []).map((shot) => ({
    kind: "image",
    id: shot.id,
    url: shot.url,
    alt: shot.altText ?? `${game.title} screenshot`,
    caption: shot.caption,
  }));
  const clips: GameMediaViewerItem[] = videos.map((video) => ({
    kind: "video",
    id: video.id,
    url: video.url,
    title: video.title,
    thumbnailUrl: buildYouTubeThumbnail(video.url, video.thumbnailUrl ?? game.media.coverImage),
  }));
  return [...images, ...clips];
}

export function MediaSection({ game }: MediaSectionProps) {
  const tEd = useTranslations("gameDetails.editorial");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const screenshots = game.media.screenshots ?? [];
  const uniqueVideos = dedupeVideos(game.media.videos ?? []);

  if (screenshots.length === 0 && uniqueVideos.length === 0) return null;

  const viewerItems = buildViewerItems(game, uniqueVideos);
  const [featured, ...rest] = screenshots;
  const visibleShots = featured ? [featured, ...rest.slice(0, GRID_SIDE_SHOTS)] : [];
  const railShots = rest.slice(GRID_SIDE_SHOTS);

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <div className="editorial-game-detail-section-header">
        <div>
          <KickerLabel className="mb-3">07 — {tEd("sections.media")}</KickerLabel>
          <h2>{tEd.rich("sections.mediaTitle", accentRich)}</h2>
        </div>
        <p className="editorial-game-detail-section-header-meta">
          {tEd("sections.mediaCount", {
            screenshots: screenshots.length,
            videos: uniqueVideos.length,
          })}
        </p>
      </div>

      {visibleShots.length > 0 && (
        <div className="editorial-game-detail-media-grid">
          {visibleShots.map((shot, index) => (
            <button
              key={shot.id}
              type="button"
              onClick={() => setViewerIndex(index)}
              aria-label={tEd("mediaViewer.openImage", { index: index + 1, total: screenshots.length })}
              className={`editorial-game-detail-media-tile block w-full cursor-zoom-in ${
                index === 0 ? "editorial-game-detail-media-tile--featured" : ""
              }`}
            >
              <AppImage
                src={shot.url}
                alt={shot.altText ?? `${game.title} screenshot`}
                fill
                sizes={index === 0 ? "(min-width: 1024px) 66vw, 100vw" : "33vw"}
              />
              <div className="editorial-scanlines" />
            </button>
          ))}
        </div>
      )}

      <MediaScreenshotRail
        screenshots={railShots}
        startIndex={visibleShots.length}
        total={screenshots.length}
        gameTitle={game.title}
        onOpen={setViewerIndex}
      />

      <MediaVideoRail
        videos={uniqueVideos}
        startIndex={screenshots.length}
        fallbackThumbnail={game.media.coverImage}
        onOpen={setViewerIndex}
      />

      {viewerIndex !== null && (
        <MediaLightbox
          items={viewerItems}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </section>
  );
}
