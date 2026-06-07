"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { Icon } from "@iconify/react";

interface MediaCarouselProps {
  src: string;
  alt: string;
  total: number;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
}

export function CharacterMediaCarousel({
  src,
  alt,
  total,
  currentIndex,
  onPrev,
  onNext,
}: MediaCarouselProps) {
  return (
    <div className="border-editorial-line bg-editorial-2 relative mb-4 aspect-video overflow-hidden rounded-2xl border">
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
