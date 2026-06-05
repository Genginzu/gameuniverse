import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";

/**
 * Skeleton matching the PlayerLibraryGrid layout : grille `editorial-library-grid`
 * de `GameCardSkeleton`. Cohérent avec le skeleton utilisé sur `/library`.
 */
export function PlayerLibraryGridSkeleton() {
  return (
    <div className="editorial-library-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
}
