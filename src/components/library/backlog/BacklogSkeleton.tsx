"use client";

/** Loading placeholder for the backlog manager. */
export function BacklogSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" data-testid="backlog-skeleton">
      <div className="bg-editorial-2 h-32 rounded-3xl" />
      <div className="bg-editorial-2 h-20 rounded-2xl" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-editorial-2 h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
