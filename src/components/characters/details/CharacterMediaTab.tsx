"use client";

import { useState } from "react";
import { LazyImage } from "@/components/ui/lazy-image";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { CharacterMedia } from "@/types/character";

interface CharacterMediaTabProps {
  media: CharacterMedia;
  characterName: string;
}

export function CharacterMediaTab({ media, characterName }: CharacterMediaTabProps) {
  const t = useTranslations();
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0);
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  const hasNoMedia =
    media.screenshots.length === 0 && media.artwork.length === 0 && media.videos.length === 0;

  if (hasNoMedia) {
    return (
      <div className="py-16 text-center">
        <Icon icon="lucide:eye" className="mx-auto mb-4 h-12 w-12 text-slate-500" />
        <p className="text-slate-400">{t("characters.media.noMedia")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {media.screenshots.length > 0 && (
        <ScreenshotsSection
          screenshots={media.screenshots}
          characterName={characterName}
          selectedIndex={selectedScreenshotIndex}
          onSelect={setSelectedScreenshotIndex}
        />
      )}

      {media.artwork.length > 0 && (
        <ArtworkSection
          artwork={media.artwork}
          characterName={characterName}
          selectedIndex={selectedArtworkIndex}
          onSelect={setSelectedArtworkIndex}
        />
      )}

      {media.videos.length > 0 && (
        <VideosSection
          videos={media.videos}
          selectedIndex={selectedVideoIndex}
          onSelect={setSelectedVideoIndex}
        />
      )}
    </div>
  );
}

/* ── Screenshots ── */

interface ScreenshotsSectionProps {
  screenshots: CharacterMedia["screenshots"];
  characterName: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function ScreenshotsSection({
  screenshots,
  characterName,
  selectedIndex,
  onSelect,
}: ScreenshotsSectionProps) {
  const t = useTranslations();

  return (
    <section>
      <h3 className="mb-6 text-xl font-bold text-white">{t("characters.media.screenshots")}</h3>
      <MediaCarousel
        src={screenshots[selectedIndex]?.url || ""}
        alt={`${characterName} screenshot`}
        total={screenshots.length}
        currentIndex={selectedIndex}
        onPrev={() => onSelect(selectedIndex > 0 ? selectedIndex - 1 : screenshots.length - 1)}
        onNext={() => onSelect(selectedIndex < screenshots.length - 1 ? selectedIndex + 1 : 0)}
      />
      <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
        {screenshots.map((screenshot, index) => (
          <button
            key={screenshot.id}
            onClick={() => onSelect(index)}
            className={`relative aspect-video overflow-hidden rounded-lg transition-all ${
              selectedIndex === index
                ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            <LazyImage
              src={screenshot.url}
              alt={`Screenshot ${index + 1}`}
              fill
              className="object-cover"
              sizes="100px"
              showSkeleton={true}
            />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ── Artwork ── */

interface ArtworkSectionProps {
  artwork: CharacterMedia["artwork"];
  characterName: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function ArtworkSection({ artwork, characterName, selectedIndex, onSelect }: ArtworkSectionProps) {
  const t = useTranslations();

  return (
    <section>
      <h3 className="mb-6 text-xl font-bold text-white">{t("characters.media.artwork")}</h3>
      <MediaCarousel
        src={artwork[selectedIndex]?.url || ""}
        alt={`${characterName} artwork`}
        total={artwork.length}
        currentIndex={selectedIndex}
        onPrev={() => onSelect(selectedIndex > 0 ? selectedIndex - 1 : artwork.length - 1)}
        onNext={() => onSelect(selectedIndex < artwork.length - 1 ? selectedIndex + 1 : 0)}
      />
      <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
        {artwork.map((art, index) => (
          <button
            key={art.id}
            onClick={() => onSelect(index)}
            className={`relative aspect-video overflow-hidden rounded-lg transition-all ${
              selectedIndex === index
                ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            <LazyImage
              src={art.url}
              alt={`Artwork ${index + 1}`}
              fill
              className="object-cover"
              sizes="100px"
              showSkeleton={true}
            />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ── Videos ── */

interface VideosSectionProps {
  videos: CharacterMedia["videos"];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function VideosSection({ videos, selectedIndex, onSelect }: VideosSectionProps) {
  const t = useTranslations();

  return (
    <section>
      <h3 className="mb-6 text-xl font-bold text-white">{t("characters.media.videos")}</h3>
      <div className="relative mb-4 aspect-video overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50">
        {videos[selectedIndex]?.url ? (
          <video
            src={videos[selectedIndex].url}
            controls
            className="h-full w-full object-cover"
            poster={videos[selectedIndex]?.thumbnailUrl}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon icon="lucide:play" className="h-16 w-16 text-slate-400" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {videos.map((video, index) => (
          <button
            key={video.id}
            onClick={() => onSelect(index)}
            className={`group relative overflow-hidden rounded-xl border transition-all ${
              selectedIndex === index
                ? "border-white ring-2 ring-white/20"
                : "border-slate-700/50 hover:border-slate-600"
            }`}
          >
            <div className="relative aspect-video">
              {video.thumbnailUrl ? (
                <LazyImage
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  className="object-cover"
                  sizes="200px"
                  showSkeleton={true}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-800">
                  <Icon icon="lucide:play" className="h-8 w-8 text-slate-400" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Icon icon="lucide:play" className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="bg-slate-800/80 p-2">
              <p className="truncate text-sm font-medium text-white">{video.title}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ── Carousel réutilisable (screenshots / artwork) ── */

interface MediaCarouselProps {
  src: string;
  alt: string;
  total: number;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
}

function MediaCarousel({ src, alt, total, currentIndex, onPrev, onNext }: MediaCarouselProps) {
  return (
    <div className="relative mb-4 aspect-video overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50">
      <LazyImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 80vw"
        showSkeleton={true}
      />
      {total > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white backdrop-blur-xs transition-all hover:bg-black/80"
          >
            <Icon icon="lucide:chevron-left" className="h-5 w-5" />
          </button>
          <button
            onClick={onNext}
            className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white backdrop-blur-xs transition-all hover:bg-black/80"
          >
            <Icon icon="lucide:chevron-right" className="h-5 w-5" />
          </button>
        </>
      )}
      <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-xs">
        {currentIndex + 1} / {total}
      </div>
    </div>
  );
}
