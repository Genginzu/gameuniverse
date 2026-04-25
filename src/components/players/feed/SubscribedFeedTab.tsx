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
    <section className="mb-8">
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
              <Skeleton
                key={i}
                className="h-24 w-full rounded-xl bg-gray-200 dark:bg-slate-700/50"
              />
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
        <Skeleton key={i} className="h-24 w-full rounded-xl bg-gray-200 dark:bg-slate-700/50" />
      ))}
    </div>
  );
}

function FeedEmpty() {
  const t = useTranslations("players.feed");

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white/80 py-12 text-center backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/50">
      <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-slate-700/50">
        <Icon icon="lucide:newspaper" className="h-10 w-10 text-gray-400 dark:text-slate-400" />
      </div>
      <p className="text-sm text-gray-500 dark:text-slate-400">{t("empty")}</p>
    </div>
  );
}
