"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

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

  return (
    <div className="space-y-12">
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedScreenshotIndex((prev: number) =>
                        prev < media.screenshots.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                  >
                    <ChevronRight className="h-5 w-5" />
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedArtworkIndex((prev: number) =>
                        prev < media.artwork.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                  >
                    <ChevronRight className="h-5 w-5" />
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

      {/* Videos Section */}
      {media.videos.length > 0 && (
        <div>
          <h3 className="mb-6 text-xl font-bold text-white">{tDetails("media.videos")}</h3>
          <div>
            {/* Main video */}
            <div className="relative mb-6 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
              {media.videos[selectedVideoIndex]?.url ? (
                <video
                  src={media.videos[selectedVideoIndex].url}
                  controls
                  className="h-full w-full object-cover"
                  poster={media.videos[selectedVideoIndex]?.thumbnailUrl}
                >
                  {tDetails("media.videoNotSupported")}
                </video>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Play className="h-16 w-16 text-slate-400" />
                </div>
              )}

              {/* Navigation */}
              {media.videos.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedVideoIndex((prev: number) =>
                        prev > 0 ? prev - 1 : media.videos.length - 1
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedVideoIndex((prev: number) =>
                        prev < media.videos.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Indicator */}
              <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                {selectedVideoIndex + 1} / {media.videos.length}
              </div>
            </div>

            {/* Video list */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {media.videos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideoIndex(index)}
                  className={`group relative overflow-hidden rounded-xl border transition-all ${
                    selectedVideoIndex === index
                      ? "border-white ring-2 ring-white/20"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="relative aspect-video">
                    {video.thumbnailUrl ? (
                      <LazyImage
                        src={video.thumbnailUrl}
                        alt={video.title || `Video ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="300px"
                        showSkeleton={true}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-800">
                        <Play className="h-8 w-8 text-slate-400" />
                      </div>
                    )}

                    {/* Overlay play button */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>

                    {/* Duration */}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                        {Math.floor(video.duration / 60)}:
                        {(video.duration % 60).toString().padStart(2, "0")}
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h4 className="line-clamp-2 text-left text-sm font-medium text-white">
                      {video.title || `Video ${index + 1}`}
                    </h4>
                    {video.description && (
                      <p className="mt-1 line-clamp-2 text-left text-xs text-slate-400">
                        {video.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
