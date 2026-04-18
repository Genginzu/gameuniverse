import { Skeleton } from "@/components/ui/skeleton";

/**
 * Next.js loading state for the characters list page.
 */
export default function CharactersLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-white/10" />
        <Skeleton className="h-10 w-36 rounded-md bg-white/10" />
      </div>
      <Skeleton className="h-10 w-full rounded-md bg-white/10" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-2xl bg-white/10" />
        ))}
      </div>
    </div>
  );
}
