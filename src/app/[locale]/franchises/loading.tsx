import { Skeleton } from "@/components/ui/skeleton";

/** Loading state of the franchises listing (editorial dark surfaces). */
export default function FranchisesLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Skeleton className="h-8 w-48 bg-white/10" />
      <Skeleton className="h-14 w-full max-w-xl rounded-[14px] bg-white/10" />
      <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[3/4] rounded-2xl bg-white/10" />
        ))}
      </div>
    </div>
  );
}
