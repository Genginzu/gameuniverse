"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { Icon } from "@iconify/react";

interface MediaItem {
  id: string;
  url: string;
}

interface MediaGalleryImageSectionProps {
  items: MediaItem[];
  title: string;
  altPrefix: string;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

export function MediaGalleryImageSection({
  items,
  title,
  altPrefix,
  selectedIndex,
  onSelectIndex,
}: MediaGalleryImageSectionProps) {
  return (
    <div>
      <h3 className="mb-6 text-xl font-bold text-white">{title}</h3>
      <div>
        {/* Main image */}
        <div className="relative mb-6 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
          <LazyImage
            src={items[selectedIndex]?.url || ""}
            alt={`${altPrefix}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 80vw"
            showSkeleton={true}
          />

          {items.length > 1 && (
            <>
              <button
                onClick={() =>
                  onSelectIndex(selectedIndex > 0 ? selectedIndex - 1 : items.length - 1)
                }
                className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
              >
                <Icon icon="lucide:chevron-left" className="h-5 w-5" />
              </button>
              <button
                onClick={() =>
                  onSelectIndex(selectedIndex < items.length - 1 ? selectedIndex + 1 : 0)
                }
                className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
              >
                <Icon icon="lucide:chevron-right" className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
            {selectedIndex + 1} / {items.length}
          </div>
        </div>

        {/* Thumbnails */}
        <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-8">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onSelectIndex(index)}
              className={`relative aspect-video overflow-hidden rounded-xl transition-all ${
                selectedIndex === index
                  ? "scale-105 ring-2 ring-white"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <LazyImage
                src={item.url}
                alt={`${altPrefix} ${index + 1}`}
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
  );
}
