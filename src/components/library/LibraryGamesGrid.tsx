"use client";

/**
 * LibraryGamesGrid : grid of the player's own library games (`/library`).
 * Each card carries the status menu (playing, completed…) instead of the
 * quick add; statuses are seeded in one batch request.
 */

import { GameCard } from "@/components/games/GameCard";
import { LibraryStatusProvider } from "@/components/providers/LibraryStatusProvider";
import { hasTopLeftBadges } from "@/lib/utils/gameCardBadges";
import type { GameSummary } from "@/types/game";
import { LibraryCardStatusMenu } from "./LibraryCardStatusMenu";

const GRID =
  "grid grid-cols-1 gap-4 min-[475px]:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5 min-[1536px]:grid-cols-6 min-[1536px]:gap-5";

export function LibraryGamesGrid({ games }: { games: GameSummary[] }) {
  return (
    <LibraryStatusProvider gameIds={games.map((game) => game.id)}>
      <div className={GRID} data-testid="editorial-library-grid">
        {games.map((game, index) => (
          <GameCard
            key={game.id}
            game={game}
            priority={index < 5}
            actions={
              <LibraryCardStatusMenu
                gameId={game.id}
                title={game.title}
                belowBadges={hasTopLeftBadges(game)}
              />
            }
          />
        ))}
      </div>
    </LibraryStatusProvider>
  );
}
