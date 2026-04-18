import { GameDetailsSkeleton } from "@/components/games/details/GameDetailsSkeleton";

/**
 * Next.js loading state for the game detail page.
 * Uses the proper detail skeleton instead of the parent grid skeleton.
 */
export default function GameDetailLoading() {
  return <GameDetailsSkeleton />;
}
