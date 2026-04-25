"use client";

import { Icon } from "@iconify/react";
import { useState } from "react";
import { extractYouTubeVideoId } from "./GameMediaGallery";

interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title?: string;
}

interface MediaGalleryVideoSectionProps {
  videos: MediaItem[];
  title: string;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

export function MediaGalleryVideoSection({
  videos,
  title,
  selectedIndex,
  onSelectIndex,
}: MediaGalleryVideoSectionProps) {
  const currentVideoId = extractYouTubeVideoId(videos[selectedIndex]?.url ?? "");

  return (
    <div>
      <h3 className="mb-6 text-xl font-bold text-white">{title}</h3>
      <div>
        {/* Main video embed */}
        <div className="relative mb-6 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
          {currentVideoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${currentVideoId}`}
              title={videos[selectedIndex]?.title || `Video ${selectedIndex + 1}`}
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

          {videos.length > 1 && (
            <>
              <button
                onClick={() =>
                  onSelectIndex(selectedIndex > 0 ? selectedIndex - 1 : videos.length - 1)
                }
                className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
              >
                <Icon icon="lucide:chevron-left" className="h-5 w-5" />
              </button>
              <button
                onClick={() =>
                  onSelectIndex(selectedIndex < videos.length - 1 ? selectedIndex + 1 : 0)
                }
                className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
              >
                <Icon icon="lucide:chevron-right" className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
            {selectedIndex + 1} / {videos.length}
          </div>
        </div>

        {/* Video thumbnails */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {videos.map((video, index) => {
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
                isSelected={selectedIndex === index}
                onSelect={() => onSelectIndex(index)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
