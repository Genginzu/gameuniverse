import { EntitySkeleton, type EntitySkeletonConfig } from "./EntitySkeleton";

export interface GridSkeletonProps {
  skeletonConfig: EntitySkeletonConfig;
  count?: number;
  className?: string;
}

/**
 * GridSkeleton - A generic grid skeleton component that renders multiple EntitySkeleton items
 * 
 * Uses the same responsive grid layout as the current entity-specific grid implementations:
 * - 1 column on mobile
 * - 2 columns on xs screens
 * - 3 columns on md screens
 * - 4 columns on lg screens
 * - 5 columns on xl screens
 * - 6 columns on 2xl screens
 */
export function GridSkeleton({
  skeletonConfig,
  count = 20,
  className = "",
}: GridSkeletonProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Responsive grid with better breakpoints - matches current implementations */}
      <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: count }).map((_, index) => (
          <EntitySkeleton key={index} config={skeletonConfig} />
        ))}
      </div>
    </div>
  );
}

export default GridSkeleton;
