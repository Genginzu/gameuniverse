import { Skeleton } from "@/components/ui/skeleton";

/**
 * Next.js loading state for admin routes.
 * Shown during navigation between admin pages.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>

      {/* Count */}
      <Skeleton className="h-4 w-32" />

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" style={{ maxWidth: `${80 + i * 20}px` }} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-800"
          >
            {Array.from({ length: 4 }).map((_, colIdx) => (
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
