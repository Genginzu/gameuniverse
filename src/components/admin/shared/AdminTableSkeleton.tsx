import { Skeleton } from "@/components/ui/skeleton";

interface AdminTableSkeletonProps {
  columns?: number;
  rows?: number;
  showSearch?: boolean;
  showImage?: boolean;
}

/**
 * Skeleton placeholder for admin list tables.
 * Preserves the visual structure (search bar, count, table rows)
 * to avoid layout shifts during initial load.
 */
export function AdminTableSkeleton({
  columns = 4,
  rows = 8,
  showSearch = true,
  showImage = false,
}: AdminTableSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Search bar skeleton */}
      {showSearch && (
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      )}

      {/* Total count skeleton */}
      <Skeleton className="h-4 w-32" />

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          {showImage && <Skeleton className="h-4 w-10" />}
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" style={{ maxWidth: `${80 + i * 20}px` }} />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-800"
          >
            {showImage && <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />}
            {Array.from({ length: columns }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                className="h-4 flex-1"
                style={{ maxWidth: `${100 + ((colIdx * 37 + rowIdx * 13) % 60)}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
