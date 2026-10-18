"use client";

import { memo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/components/ui/skeleton";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { useFriendsFeed } from "@/hooks/useFriendsFeed";
import { FeedFilters } from "./FeedFilters";
import { FeedItem } from "@/components/players/feed/FeedItem";

interface FeedPageContentProps {
  locale: string;
}

export const FeedPageContent = memo(function FeedPageContent({
  locale,
}: FeedPageContentProps) {
  const t = useTranslations("feedPage");
  const {
    events,
    isLoading,
    isLoadingMore,
    hasNextPage,
    activeFilter,
    error,
    setFilter,
    loadMore,
  } = useFriendsFeed(locale);

  const sentinelRef = useRef<HTMLDivElement>(null);

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
    <section className="w-full">
      <EditorialContainer>
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--editorial-muted)]">
            {t("subtitle")}
          </p>
        </header>

        <FeedFilters activeFilter={activeFilter} onFilterChange={setFilter} />

        <div
          className="editorial-activity"
          role="feed"
          aria-busy={isBusy}
          aria-label={t("title")}
        >
          {isLoading && <FeedSkeleton />}

          {!isLoading && error && (
            <p className="py-8 text-center text-sm text-red-400">
              {error}
            </p>
          )}

          {!isLoading && !error && events.length === 0 && (
            <FeedEmpty hasFilter={activeFilter !== "all"} />
          )}

          {!isLoading && events.length > 0 && (
            <div className="flex flex-col gap-3">
              {events.map((event) => (
                <FeedItem key={`${event.type}-${event.id}`} event={event} locale={locale} />
              ))}
            </div>
          )}

          {isLoadingMore && (
            <div className="mt-3 flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="editorial-activity-skeleton" />
              ))}
            </div>
          )}

          <div ref={sentinelRef} className="h-1" aria-hidden="true" />
        </div>
      </EditorialContainer>
    </section>
  );
});

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="editorial-activity-skeleton" />
      ))}
    </div>
  );
}

function FeedEmpty({ hasFilter }: { hasFilter: boolean }) {
  const t = useTranslations("feedPage");

  return (
    <div className="editorial-activity-empty">
      <div className="editorial-activity-empty-icon">
        <Icon
          icon={hasFilter ? "lucide:search-x" : "lucide:users"}
          className="h-10 w-10"
          aria-hidden="true"
        />
      </div>
      <p className="editorial-activity-empty-text">
        {hasFilter ? t("emptyFiltered") : t("empty")}
      </p>
    </div>
  );
}
