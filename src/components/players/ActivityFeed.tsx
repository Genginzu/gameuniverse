"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Smile } from "lucide-react";
import { usePlayerActivity } from "@/hooks/usePlayerActivity";
import { ActivityFilters } from "./ActivityFilters";
import { ActivityItem } from "./ActivityItem";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityFeedProps {
  playerId: string;
  locale: string;
}

export function ActivityFeed({ playerId, locale }: ActivityFeedProps) {
  const t = useTranslations("players.activity");
  const {
    events,
    isLoading,
    isLoadingMore,
    hasNextPage,
    activeFilter,
    error,
    setFilter,
    loadMore,
  } = usePlayerActivity(playerId, locale);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isLoadingMore, loadMore]);

  const isBusy = isLoading || isLoadingMore;

  return (
    <section className="mb-8">
      <ActivityFilters activeFilter={activeFilter} onFilterChange={setFilter} />

      <div role="feed" aria-busy={isBusy} aria-label={t("feedLabel")}>
        {isLoading && <ActivityFeedSkeleton />}

        {!isLoading && error && (
          <p className="py-8 text-center text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        {!isLoading && !error && events.length === 0 && <ActivityFeedEmpty />}

        {!isLoading && events.length > 0 && (
          <div className="space-y-3">
            {events.map((event) => (
              <ActivityItem key={`${event.type}-${event.id}`} event={event} locale={locale} />
            ))}
          </div>
        )}

        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="mt-3 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-24 w-full rounded-xl bg-gray-200 dark:bg-slate-700/50"
              />
            ))}
          </div>
        )}

        {/* Sentinel element for IntersectionObserver */}
        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      </div>
    </section>
  );
}

function ActivityFeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl bg-gray-200 dark:bg-slate-700/50" />
      ))}
    </div>
  );
}

function ActivityFeedEmpty() {
  const t = useTranslations("players.activity");

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-12 text-center dark:border-slate-700/50 dark:bg-slate-800/50">
      <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-slate-700/50">
        <Smile className="h-10 w-10 text-gray-400 dark:text-slate-400" />
      </div>
      <p className="text-sm text-gray-500 dark:text-slate-400">{t("empty")}</p>
    </div>
  );
}
