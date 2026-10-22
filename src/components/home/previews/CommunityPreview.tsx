"use client";

import { useLocale } from "next-intl";

import { PlayerCard } from "@/components/players/PlayerCard";
import type { CharacterSummary } from "@/types/character";
import type { GameSummary } from "@/types/game";
import type { PlayerSummary } from "@/types/player";
import { DEMO_PLAYERS } from "./previewDemoData";

interface CommunityPreviewProps {
  /** Their artworks dress the demo profile banners. */
  games: GameSummary[];
  /** Their portraits are used as demo avatars (like a favourite character). */
  characters: CharacterSummary[];
}

function withImages(
  player: PlayerSummary,
  index: number,
  games: GameSummary[],
  characters: CharacterSummary[]
): PlayerSummary {
  const game = games[index];
  return {
    ...player,
    bannerUrl: game?.backgroundImage ?? game?.coverImage ?? null,
    avatarUrl: characters[index]?.mainImage ?? null,
  };
}

/** Player profile cards: demo profiles dressed with real game artworks and character portraits. */
export function CommunityPreview({ games, characters }: CommunityPreviewProps) {
  const locale = useLocale();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
      {DEMO_PLAYERS.map((player, index) => (
        <div key={player.id} className={index === 2 ? "hidden sm:block" : undefined}>
          <PlayerCard player={withImages(player, index, games, characters)} locale={locale} />
        </div>
      ))}
    </div>
  );
}
