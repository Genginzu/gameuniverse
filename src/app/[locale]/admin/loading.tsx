import { Skeleton } from "@/components/ui/skeleton";

/**
 * Next.js loading state for admin routes.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-white/10" />
        <Skeleton className="h-10 w-36 rounded-md bg-white/10" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-md bg-white/10" />
        <Skeleton className="h-10 w-24 rounded-md bg-white/10" />
      </div>
      <Skeleton className="h-4 w-32 bg-white/10" />
      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="flex gap-4 border-b border-white/10 bg-white/5 px-4 py-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4 flex-1 bg-white/10"
              style={{ maxWidth: `${80 + i * 20}px` }}
            />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-center gap-4 border-b border-white/5 px-4 py-3 last:border-b-0"
          >
            {Array.from({ length: 4 }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                className="h-4 flex-1 bg-white/10"
                style={{ maxWidth: `${100 + ((colIdx * 37 + rowIdx * 13) % 60)}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
