"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { CharacterMedia } from "@/types/character";

interface CharacterVideosSectionProps {
  videos: CharacterMedia["videos"];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function CharacterVideosSection({
  videos,
  selectedIndex,
  onSelect,
}: CharacterVideosSectionProps) {
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
