"use client";

import { memo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { usePlayerReviews } from "@/hooks/usePlayerReviews";
import { PlayerReviewsStats } from "./PlayerReviewsStats";
import { PlayerReviewsSortSelect } from "./PlayerReviewsSortSelect";
import { PlayerReviewCard } from "./PlayerReviewCard";

interface PlayerReviewsFeedProps {
  playerId: string;
  locale: string;
}

export const PlayerReviewsFeed = memo(function PlayerReviewsFeed({
  playerId,
  locale,
}: PlayerReviewsFeedProps) {
  const t = useTranslations("players.reviews");
  const {
    reviews,
    stats,
    isLoading,
    isLoadingMore,
    hasNextPage,
    sortOption,
    error,
    setSort,
    loadMore,
  } = usePlayerReviews(playerId, locale);

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
    <section className="editorial-reviews mb-8 space-y-6">
      {/* Stats block — shown once loaded */}
      {stats && <PlayerReviewsStats stats={stats} />}

      {/* Sort selector — right-aligned */}
      {!isLoading && reviews.length > 0 && (
        <div className="flex justify-end">
          <PlayerReviewsSortSelect value={sortOption} onChange={setSort} />
        </div>
      )}

      <div role="feed" aria-busy={isBusy} aria-label={t("feedLabel")}>
        {isLoading && <ReviewsFeedSkeleton />}

        {!isLoading && error && (
          <p className="py-8 text-center text-sm text-red-500 dark:text-red-400">{t("error")}</p>
        )}

        {!isLoading && !error && reviews.length === 0 && <ReviewsFeedEmpty />}

        {!isLoading && reviews.length > 0 && (
          <div className="space-y-5">
            {reviews.map((review) => (
              <PlayerReviewCard key={review.id} review={review} locale={locale} />
            ))}
          </div>
        )}

        {/* Loading more skeleton */}
        {isLoadingMore && (
          <div className="mt-4 space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Sentinel for IntersectionObserver */}
        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      </div>
    </section>
  );
});

function SkeletonCard() {
  return (
    <div className="glass-card animate-pulse rounded-xl p-5">
      <div className="mb-4 flex gap-4">
        <div className="h-20 w-14 rounded-lg bg-gray-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="h-6 w-16 rounded bg-gray-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

function ReviewsFeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function ReviewsFeedEmpty() {
  const t = useTranslations("players.reviews");

  return (
    <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-12 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-slate-700/50">
        <Icon
          icon="lucide:message-square-off"
          className="h-10 w-10 text-gray-400 dark:text-slate-400"
        />
      </div>
      <p className="text-sm text-gray-500 dark:text-slate-400">{t("empty")}</p>
    </div>
  );
}
