"use client";

/**
 * Section "Soundtrack" : compositeur + plateformes de streaming Spotify /
 * YouTube. Layout magazine (heading rail + carte large 2 colonnes).
 *
 * Si embed Spotify ou YouTube présent, on l'affiche dans la 2e moitié
 * de la card pour permettre l'écoute directe sans quitter la page.
 */

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { GameDetails } from "@/types/game";
import { accentRich } from "../utils/accent-rich";

interface MusicSectionProps {
  game: GameDetails;
}

function getSpotifyEmbedSrc(url: string): string {
  // Convert /track/X or /album/X URL into /embed/track/X.
  return url.replace("open.spotify.com/", "open.spotify.com/embed/");
}

function getYoutubeEmbedSrc(url: string): string {
  try {
    const parsed = new URL(url);
    const id = parsed.searchParams.get("v") ?? parsed.pathname.replace(/^\//, "");
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return url;
  }
}

export function MusicSection({ game }: MusicSectionProps) {
  const tEd = useTranslations("gameDetails.editorial");
  const tMusic = useTranslations("gameDetails.music");
  const music = game.music;

  if (!music) return null;
  const hasContent = music.composer || music.spotifyEmbedUrl || music.youtubeVideoUrl;
  if (!hasContent) return null;

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <div className="editorial-game-detail-section-grid">
        <div className="editorial-game-detail-section-heading">
          <KickerLabel className="mb-3">09 — {tEd("sections.soundtrack")}</KickerLabel>
          <h2>{tEd.rich("sections.soundtrackTitle", accentRich)}</h2>
        </div>
        <div>
          <SpotlightCard className="editorial-game-detail-playtime-card">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                {music.composer && (
                  <>
                    <KickerLabel className="mb-2">{tMusic("composer")}</KickerLabel>
                    <p className="editorial-game-detail-bento-display editorial-game-detail-bento-display-sm">
                      {music.composer}
                    </p>
                  </>
                )}
              </div>
              <div className="space-y-4">
                {music.spotifyEmbedUrl && (
                  <iframe
                    src={getSpotifyEmbedSrc(music.spotifyEmbedUrl)}
                    width="100%"
                    height="232"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title={tMusic("spotifyPlayer")}
                    className="rounded-xl border-0"
                  />
                )}
                {music.youtubeVideoUrl && (
                  <div className="aspect-video overflow-hidden rounded-xl">
                    <iframe
                      src={getYoutubeEmbedSrc(music.youtubeVideoUrl)}
                      width="100%"
                      height="100%"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      title={tMusic("youtubePlayer")}
                      className="border-0"
                    />
                  </div>
                )}
                {!music.spotifyEmbedUrl && !music.youtubeVideoUrl && music.composer && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Icon icon="lucide:music" className="h-5 w-5" />
                    {tMusic("comingSoon")}
                  </div>
                )}
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}
