import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";

/**
 * Skeleton matching the PlayerLibraryGrid layout (grille éditoriale inline)
 * de `GameCardSkeleton`. Cohérent avec le skeleton utilisé sur `/library`.
 */
export function PlayerLibraryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 min-[475px]:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5 min-[1536px]:grid-cols-6 min-[1536px]:gap-5">
      {Array.from({ length: 12 }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
}
