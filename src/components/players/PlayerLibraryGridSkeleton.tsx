import { Gamepad2 } from "lucide-react";

/**
 * Skeleton matching the PlayerLibraryGrid layout: header bar + 6-column cover grid.
 * Used as a loading placeholder for the library tab (especially with lazy loading).
 */
export function PlayerLibraryGridSkeleton() {
  return (
    <div className="mb-8">
      {/* Header: title + count badge */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-blue-500 dark:text-blue-400" />
          <div className="h-7 w-36 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700" />
        </div>
        <div className="h-6 w-28 animate-pulse rounded-full bg-gray-100 dark:bg-slate-700/50" />
      </div>

      {/* Cover grid — mirrors the 6-column responsive grid of PlayerLibraryGrid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50"
          >
            <div className="relative aspect-3/4 bg-gray-200 dark:bg-slate-700">
              {/* Status badge placeholder */}
              <div className="absolute top-2 left-2 h-5 w-14 rounded-full bg-gray-300/50 dark:bg-slate-600/50" />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
              {/* Title placeholder */}
              <div className="absolute right-0 bottom-0 left-0 space-y-1.5 p-3">
                <div className="h-3.5 w-3/4 rounded bg-gray-300/60 dark:bg-slate-600/60" />
                <div className="h-3 w-1/2 rounded bg-gray-300/40 dark:bg-slate-600/40" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
