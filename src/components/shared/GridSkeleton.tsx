import { EntitySkeleton, type EntitySkeletonConfig } from "./EntitySkeleton";

export interface GridSkeletonProps {
  skeletonConfig: EntitySkeletonConfig;
  count?: number;
  className?: string;
  /** Override the default responsive grid classes to match a specific page layout */
  gridClassName?: string;
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
  gridClassName,
}: GridSkeletonProps) {
  const defaultGrid =
    "xs:grid-cols-2 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

  return (
    <div className={`space-y-8 ${className}`}>
      <div className={gridClassName || defaultGrid}>
        {Array.from({ length: count }).map((_, index) => (
          <EntitySkeleton key={index} config={skeletonConfig} />
        ))}
      </div>
    </div>
  );
}

export default GridSkeleton;
