"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/** Thumbnail card for a video with native img fallback on error */
function VideoThumbnailCard({
  video,
  index,
  thumbnail,
  isSelected,
  onSelect,
}: {
  video: { title?: string };
  index: number;
  thumbnail: string | null;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const showImage = thumbnail && !imgError;

  return (
    <button
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-xl border transition-all ${
        isSelected ? "border-white ring-2 ring-white/20" : "border-slate-700 hover:border-slate-600"
      }`}
    >
      <div className="relative aspect-video">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={video.title || `Video ${index + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800">
            <Icon icon="lucide:play" className="h-8 w-8 text-slate-400" />
          </div>
        )}

        {/* Overlay play button */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="rounded-full bg-white/20 p-2 backdrop-blur-xs">
            <Icon icon="lucide:play" className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>

      <div className="p-2">
        <h4 className="line-clamp-1 text-left text-xs font-medium text-white">
          {video.title || `Video ${index + 1}`}
        </h4>
      </div>
    </button>
  );
}

/** Extract YouTube video_id from a watch URL, returns null if not parseable */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}
interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  duration?: number;
}

interface GameMedia {
  screenshots: MediaItem[];
  artwork: MediaItem[];
  videos: MediaItem[];
}

interface GameMediaGalleryProps {
  media: GameMedia;
  gameTitle: string;
}

export function GameMediaGallery({ media, gameTitle }: GameMediaGalleryProps) {
  const tDetails = useTranslations("gameDetails");
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0);
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  // Deduplicate videos by YouTube video ID (handles URL variations)
  const uniqueVideos = media.videos.filter((video, index, self) => {
    const videoId = extractYouTubeVideoId(video.url);
    if (!videoId) return true; // keep non-YouTube videos
    return index === self.findIndex((v) => extractYouTubeVideoId(v.url) === videoId);
  });

  const currentVideoId = extractYouTubeVideoId(uniqueVideos[selectedVideoIndex]?.url ?? "");

  return (
    <div className="space-y-12">
      {/* Videos Section — displayed first */}
      {uniqueVideos.length > 0 && (
        <div>
          <h3 className="mb-6 text-xl font-bold text-white">{tDetails("media.videos")}</h3>
          <div>
            {/* Main video embed */}
            <div className="relative mb-6 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
              {currentVideoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${currentVideoId}`}
                  title={
                    uniqueVideos[selectedVideoIndex]?.title || `Video ${selectedVideoIndex + 1}`
                  }
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Icon icon="lucide:play" className="h-16 w-16 text-slate-400" />
                </div>
              )}

              {/* Navigation */}
              {uniqueVideos.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedVideoIndex((prev: number) =>
                        prev > 0 ? prev - 1 : uniqueVideos.length - 1
                      )
                    }
                    className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                  >
                    <Icon icon="lucide:chevron-left" className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedVideoIndex((prev: number) =>
                        prev < uniqueVideos.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                  >
                    <Icon icon="lucide:chevron-right" className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Indicator */}
              <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                {selectedVideoIndex + 1} / {uniqueVideos.length}
              </div>
            </div>

            {/* Video list */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {uniqueVideos.map((video, index) => {
                const videoId = extractYouTubeVideoId(video.url);
                const thumbnail =
                  video.thumbnailUrl ||
                  (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

                return (
                  <VideoThumbnailCard
                    key={video.id}
                    video={video}
                    index={index}
                    thumbnail={thumbnail}
                    isSelected={selectedVideoIndex === index}
                    onSelect={() => setSelectedVideoIndex(index)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Screenshots Section */}
      {media.screenshots.length > 0 && (
        <div>
          <h3 className="mb-6 text-xl font-bold text-white">{tDetails("media.screenshots")}</h3>
          <div>
            {/* Main image */}
            <div className="relative mb-6 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
              <LazyImage
                src={media.screenshots[selectedScreenshotIndex]?.url || ""}
                alt={`${gameTitle} screenshot`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 80vw"
                showSkeleton={true}
              />

              {/* Navigation */}
              {media.screenshots.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedScreenshotIndex((prev: number) =>
                        prev > 0 ? prev - 1 : media.screenshots.length - 1
                      )
                    }
                    className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                  >
                    <Icon icon="lucide:chevron-left" className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedScreenshotIndex((prev: number) =>
                        prev < media.screenshots.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                  >
                    <Icon icon="lucide:chevron-right" className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Indicator */}
              <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                {selectedScreenshotIndex + 1} / {media.screenshots.length}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-8">
              {media.screenshots.map((screenshot, index) => (
                <button
                  key={screenshot.id}
                  onClick={() => setSelectedScreenshotIndex(index)}
                  className={`relative aspect-video overflow-hidden rounded-xl transition-all ${
                    selectedScreenshotIndex === index
                      ? "scale-105 ring-2 ring-white"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <LazyImage
                    src={screenshot.url}
                    alt={`${gameTitle} screenshot ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="120px"
                    showSkeleton={true}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Artwork Section */}
      {media.artwork.length > 0 && (
        <div>
          <h3 className="mb-6 text-xl font-bold text-white">{tDetails("media.artwork")}</h3>
          <div>
            {/* Main image */}
            <div className="relative mb-6 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
              <LazyImage
                src={media.artwork[selectedArtworkIndex]?.url || ""}
                alt={`${gameTitle} artwork`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 80vw"
                showSkeleton={true}
              />

              {/* Navigation */}
              {media.artwork.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedArtworkIndex((prev: number) =>
                        prev > 0 ? prev - 1 : media.artwork.length - 1
                      )
                    }
                    className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                  >
                    <Icon icon="lucide:chevron-left" className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedArtworkIndex((prev: number) =>
                        prev < media.artwork.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                  >
                    <Icon icon="lucide:chevron-right" className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Indicator */}
              <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                {selectedArtworkIndex + 1} / {media.artwork.length}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-8">
              {media.artwork.map((artwork, index) => (
                <button
                  key={artwork.id}
                  onClick={() => setSelectedArtworkIndex(index)}
                  className={`relative aspect-video overflow-hidden rounded-xl transition-all ${
                    selectedArtworkIndex === index
                      ? "scale-105 ring-2 ring-white"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <LazyImage
                    src={artwork.url}
                    alt={`${gameTitle} artwork ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="120px"
                    showSkeleton={true}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
