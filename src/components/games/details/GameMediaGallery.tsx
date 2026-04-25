"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { MediaGalleryVideoSection } from "./MediaGalleryVideoSection";
import { MediaGalleryImageSection } from "./MediaGalleryImageSection";

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
    if (!videoId) return true;
    return index === self.findIndex((v) => extractYouTubeVideoId(v.url) === videoId);
  });

  return (
    <div className="space-y-12">
      {uniqueVideos.length > 0 && (
        <MediaGalleryVideoSection
          videos={uniqueVideos}
          title={tDetails("media.videos")}
          selectedIndex={selectedVideoIndex}
          onSelectIndex={setSelectedVideoIndex}
        />
      )}

      {media.screenshots.length > 0 && (
        <MediaGalleryImageSection
          items={media.screenshots}
          title={tDetails("media.screenshots")}
          altPrefix={`${gameTitle} screenshot`}
          selectedIndex={selectedScreenshotIndex}
          onSelectIndex={setSelectedScreenshotIndex}
        />
      )}

      {media.artwork.length > 0 && (
        <MediaGalleryImageSection
          items={media.artwork}
          title={tDetails("media.artwork")}
          altPrefix={`${gameTitle} artwork`}
          selectedIndex={selectedArtworkIndex}
          onSelectIndex={setSelectedArtworkIndex}
        />
      )}
    </div>
  );
}
