import { CharacterCardSkeleton } from "./CharacterCardSkeleton";

interface CharacterGridSkeletonProps {
  count?: number;
}

export function CharacterGridSkeleton({ count = 20 }: CharacterGridSkeletonProps) {
  return (
    <div className="space-y-8">
      {/* Responsive grid with better breakpoints */}
      <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: count }).map((_, index) => (
          <CharacterCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
