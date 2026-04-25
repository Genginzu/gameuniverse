"use client";

import { Icon } from "@iconify/react";
import { GameDetails } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";

interface GameHeroMetadataProps {
  game: GameDetails;
  colors: GameColors;
  formatReleaseDate: (dateString?: string) => string | null;
}

export function GameHeroMetadata({ game, colors, formatReleaseDate }: GameHeroMetadataProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-6" style={{ color: colors.labelColor }}>
      {game.companies?.developers?.length > 0 ? (
        game.companies.developers.map((dev) => (
          <div key={dev.id} className="flex items-center gap-2">
            <Icon icon="lucide:users" className="h-4 w-4" style={{ color: colors.accent }} />
            <span>{dev.name}</span>
          </div>
        ))
      ) : game.developer ? (
        <div className="flex items-center gap-2">
          <Icon icon="lucide:users" className="h-4 w-4" style={{ color: colors.accent }} />
          <span>{game.developer}</span>
        </div>
      ) : null}
      {game.companies?.publishers?.length > 0 ? (
        game.companies.publishers
          .filter((pub) => !game.companies.developers?.some((dev) => dev.id === pub.id))
          .map((pub) => (
            <div key={pub.id} className="flex items-center gap-2">
              <Icon icon="lucide:globe" className="h-4 w-4" style={{ color: colors.accent }} />
              <span>{pub.name}</span>
            </div>
          ))
      ) : game.publisher && game.publisher !== game.developer ? (
        <div className="flex items-center gap-2">
          <Icon icon="lucide:globe" className="h-4 w-4" style={{ color: colors.accent }} />
          <span>{game.publisher}</span>
        </div>
      ) : null}
      {game.releaseDate && (
        <div className="flex items-center gap-2">
          <Icon icon="lucide:calendar" className="h-4 w-4" style={{ color: colors.accent }} />
          <span>{formatReleaseDate(game.releaseDate)}</span>
        </div>
      )}
    </div>
  );
}
