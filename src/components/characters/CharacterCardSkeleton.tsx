import { Skeleton } from "@/components/ui/skeleton";

export function CharacterCardSkeleton() {
  return (
    <div className="group relative">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white shadow-md">
        {/* Cover Image Skeleton */}
        <Skeleton className="h-full w-full rounded-2xl" />

        {/* Role badge skeleton */}
        <div className="absolute right-3 top-3 z-20">
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
