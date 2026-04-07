import { Skeleton } from "@/components/ui/skeleton";

/**
 * Next.js loading state for public routes.
 * Shown during navigation between pages.
 */
export default function PublicLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Hero / title area */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
