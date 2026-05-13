"use client";

/**
 * Section "Media" : screenshots + videos en mise en page asymétrique.
 *
 * Layout : 1 grand pavé "featured" (col-span-2 row-span-2) + grille
 * compacte 2x2 pour les autres screenshots. Les vidéos suivent dans une
 * grille 2 cols avec play button accent.
 *
 * Cliquer sur une vidéo ouvre l'URL d'origine (YouTube). Pour rester
 * simple, pas de modal player ici (la version onglet le faisait déjà,
 * on garde le comportement mais visuellement différent).
 */

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { GameDetails } from "@/types/game";
import { accentRich } from "../utils/accent-rich";

interface MediaSectionProps {
  game: GameDetails;
}

/** Extract YouTube video_id from a watch URL. */
function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("v") ?? parsed.pathname.replace(/^\//, "") ?? null;
  } catch {
    return null;
  }
}

function buildYouTubeThumbnail(url: string, fallback?: string): string | undefined {
  const id = extractYouTubeVideoId(url);
  if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return fallback;
}

function formatDuration(seconds?: number): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MediaSection({ game }: MediaSectionProps) {
  const tEd = useTranslations("gameDetails.editorial");

  const screenshots = game.media.screenshots ?? [];
  // Deduplicate videos by YouTube video ID (handles URL variations)
  const uniqueVideos = (game.media.videos ?? []).filter((video, index, self) => {
    const videoId = extractYouTubeVideoId(video.url);
    if (!videoId) return true;
    return index === self.findIndex((v) => extractYouTubeVideoId(v.url) === videoId);
  });

  if (screenshots.length === 0 && uniqueVideos.length === 0) return null;

  const [featured, ...rest] = screenshots;

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <div className="editorial-game-detail-section-header">
        <div>
          <KickerLabel className="mb-3">06 — {tEd("sections.media")}</KickerLabel>
          <h2>{tEd.rich("sections.mediaTitle", accentRich)}</h2>
        </div>
        <p className="editorial-game-detail-section-header-meta">
          {tEd("sections.mediaCount", {
            screenshots: screenshots.length,
            videos: uniqueVideos.length,
          })}
        </p>
      </div>

      {screenshots.length > 0 && (
        <div className="editorial-game-detail-media-grid">
          {featured && (
            <figure className="editorial-game-detail-media-tile editorial-game-detail-media-tile--featured">
              <Image
                src={featured.url}
                alt={featured.altText ?? `${game.title} screenshot`}
                fill
                sizes="(min-width: 1024px) 66vw, 100vw"
              />
              <div className="editorial-scanlines" />
            </figure>
          )}
          {rest.slice(0, 2).map((shot) => (
            <figure key={shot.id} className="editorial-game-detail-media-tile">
              <Image
                src={shot.url}
                alt={shot.altText ?? `${game.title} screenshot`}
                fill
                sizes="33vw"
              />
              <div className="editorial-scanlines" />
            </figure>
          ))}
        </div>
      )}

      {uniqueVideos.length > 0 && (
        <div className="editorial-game-detail-video-grid">
          {uniqueVideos.slice(0, 4).map((video) => {
            const thumb = buildYouTubeThumbnail(
              video.url,
              video.thumbnailUrl ?? game.media.coverImage
            );
            const duration = formatDuration(video.duration);
            return (
              <SpotlightCard
                key={video.id}
                as="a"
                href={video.url}
                className="editorial-game-detail-video-card"
              >
                {thumb && (
                  <Image
                    src={thumb}
                    alt={video.title}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                  />
                )}
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
              </SpotlightCard>
            );
          })}
        </div>
      )}
    </section>
  );
}
