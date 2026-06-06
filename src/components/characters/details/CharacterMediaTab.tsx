"use client";

import { useState } from "react";
import { LazyImage } from "@/components/ui/lazy-image";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { CharacterMedia } from "@/types/character";
import { CharacterMediaCarousel } from "./CharacterMediaCarousel";
import { CharacterVideosSection } from "./CharacterVideosSection";

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
        <Icon icon="lucide:eye" className="text-editorial-muted mx-auto mb-4 h-12 w-12" />
        <p className="text-editorial-muted">{t("characters.media.noMedia")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {media.screenshots.length > 0 && (
        <ImageGallerySection
          items={media.screenshots}
          title={t("characters.media.screenshots")}
          altPrefix={`${characterName} screenshot`}
          selectedIndex={selectedScreenshotIndex}
          onSelect={setSelectedScreenshotIndex}
        />
      )}

      {media.artwork.length > 0 && (
        <ImageGallerySection
          items={media.artwork}
          title={t("characters.media.artwork")}
          altPrefix={`${characterName} artwork`}
          selectedIndex={selectedArtworkIndex}
          onSelect={setSelectedArtworkIndex}
        />
      )}

      {media.videos.length > 0 && (
        <CharacterVideosSection
          videos={media.videos}
          selectedIndex={selectedVideoIndex}
          onSelect={setSelectedVideoIndex}
        />
      )}
    </div>
  );
}

/** Reusable image gallery section for screenshots and artwork */
function ImageGallerySection({
  items,
  title,
  altPrefix,
  selectedIndex,
  onSelect,
}: {
  items: CharacterMedia["screenshots"] | CharacterMedia["artwork"];
  title: string;
  altPrefix: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <section>
      <h3 className="mb-6 text-xl font-bold text-white">{title}</h3>
      <CharacterMediaCarousel
        src={items[selectedIndex]?.url || ""}
        alt={altPrefix}
        total={items.length}
        currentIndex={selectedIndex}
        onPrev={() => onSelect(selectedIndex > 0 ? selectedIndex - 1 : items.length - 1)}
        onNext={() => onSelect(selectedIndex < items.length - 1 ? selectedIndex + 1 : 0)}
      />
      <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelect(index)}
            className={`relative aspect-video overflow-hidden rounded-lg transition-all ${
              selectedIndex === index
                ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--editorial-bg)]"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            <LazyImage
              src={item.url}
              alt={`${altPrefix} ${index + 1}`}
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
