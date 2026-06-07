"use client";

import { memo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscribedFeed } from "@/hooks/useSubscribedFeed";
import { FeedItem } from "./FeedItem";

interface SubscribedFeedTabProps {
  viewerId: string;
  locale: string;
}

export const SubscribedFeedTab = memo(function SubscribedFeedTab({
  viewerId,
  locale,
}: SubscribedFeedTabProps) {
  const t = useTranslations("players.feed");
  const { events, isLoading, isLoadingMore, hasNextPage, error, loadMore } = useSubscribedFeed(
    viewerId,
    locale
  );

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
    <section className="editorial-activity mb-8">
      <div role="feed" aria-busy={isBusy} aria-label={t("feedLabel")}>
        {isLoading && <FeedSkeleton />}

        {!isLoading && error && (
          <p className="py-8 text-center text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        {!isLoading && !error && events.length === 0 && <FeedEmpty />}

        {!isLoading && events.length > 0 && (
          <div className="space-y-3">
            {events.map((event) => (
              <FeedItem key={`${event.type}-${event.id}`} event={event} locale={locale} />
            ))}
          </div>
        )}

        {isLoadingMore && (
          <div className="mt-3 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="editorial-activity-skeleton" />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      </div>
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

function FeedEmpty() {
  const t = useTranslations("players.feed");

  return (
    <div className="editorial-activity-empty">
      <div className="editorial-activity-empty-icon">
        <Icon icon="lucide:newspaper" className="h-10 w-10" aria-hidden="true" />
      </div>
      <p className="editorial-activity-empty-text">{t("empty")}</p>
    </div>
  );
}
