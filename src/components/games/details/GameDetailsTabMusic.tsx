"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Music, Users, Youtube } from "lucide-react";
import { useTranslations } from "next-intl";
import { GameColors } from "@/lib/utils/game-utils";
import { GameMusic } from "@/types/game";

interface GameDetailsTabMusicProps {
  music?: GameMusic | null;
  colors: GameColors;
}

/** Extracts a Spotify embed ID from various Spotify URL formats */
function getSpotifyEmbedSrc(url: string): string {
  // Already an embed URL
  if (url.includes("/embed/")) return url;
  // Handle open.spotify.com/(intl-xx/)?(album|playlist|track)/xxx(?query)
  const match = url.match(
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(album|playlist|track)\/([a-zA-Z0-9]+)/
  );
  if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`;
  return url;
}

/** Extracts a YouTube embed ID from various YouTube URL formats */
function getYoutubeEmbedSrc(url: string): string {
  // Already an embed URL
  if (url.includes("youtube.com/embed/")) return url;
  // youtu.be/xxx
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // youtube.com/watch?v=xxx or youtube.com/shorts/xxx
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`;
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  return url;
}

/** Music / soundtrack tab: composer, Spotify embed, YouTube video */
export function GameDetailsTabMusic({ music, colors }: GameDetailsTabMusicProps) {
  const tDetails = useTranslations("gameDetails");

  const hasContent = music?.composer || music?.spotifyEmbedUrl || music?.youtubeVideoUrl;

  if (!hasContent) {
    return (
      <Card className="rounded-xl border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <Music className="h-5 w-5" style={{ color: colors.accent }} />
            {tDetails("music.soundtrack")}
          </h3>
          <p className="text-slate-400">{tDetails("music.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Composer */}
      {music.composer && (
        <Card className="rounded-xl border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl">
          <CardContent className="p-6">
            <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
              <Users className="h-5 w-5" style={{ color: colors.accent }} />
              {tDetails("music.composer")}
            </h3>
            <p className="text-lg text-slate-200">{music.composer}</p>
          </CardContent>
        </Card>
      )}

      {/* Spotify embed */}
      {music.spotifyEmbedUrl && (
        <Card className="rounded-xl border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl">
          <CardContent className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
              <Music className="h-5 w-5" style={{ color: colors.accent }} />
              {tDetails("music.soundtrack")}
            </h3>
            <div className="overflow-hidden rounded-xl">
              <iframe
                src={getSpotifyEmbedSrc(music.spotifyEmbedUrl)}
                width="100%"
                height="352"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title={tDetails("music.spotifyPlayer")}
                className="border-0"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* YouTube video */}
      {music.youtubeVideoUrl && (
        <Card className="rounded-xl border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl">
          <CardContent className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
              <Youtube className="h-5 w-5" style={{ color: colors.accent }} />
              {tDetails("music.youtubeVideo")}
            </h3>
            <div className="aspect-video overflow-hidden rounded-xl">
              <iframe
                src={getYoutubeEmbedSrc(music.youtubeVideoUrl)}
                width="100%"
                height="100%"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                title={tDetails("music.youtubePlayer")}
                className="border-0"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
