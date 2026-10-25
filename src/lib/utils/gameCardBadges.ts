import type { GameCardOverlay } from "@/components/games/GameCard";
import { getDistinctPlatformIcons } from "@/lib/utils/platform-icons";
import type { GameSummary } from "@/types/game";

/**
 * Whether a GameCard shows badges in its top-left corner (platforms or library
 * status): controls layered there (quick add, status menu) sit below them.
 */
export function hasTopLeftBadges(game: GameSummary, overlay?: GameCardOverlay): boolean {
  if (overlay?.type === "library") return true;
  if (overlay?.type === "common") return false;
  return !!game.platforms && getDistinctPlatformIcons(game.platforms, 3).length > 0;
}
