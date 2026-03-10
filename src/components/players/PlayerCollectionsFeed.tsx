"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { FolderOpen } from "lucide-react";
import { usePlayerCollections } from "@/hooks/usePlayerCollections";
import { PlayerCollectionsStats } from "./PlayerCollectionsStats";
import { PlayerCollectionsSortSelect } from "./PlayerCollectionsSortSelect";
import { CollectionCard } from "@/components/collections/CollectionCard";

interface PlayerCollectionsFeedProps {
  playerId: string;
  locale: string;
  isOwner: boolean;
}

export function PlayerCollectionsFeed({ playerId, locale, isOwner }: PlayerCollectionsFeedProps) {
  const t = useTranslations("players.collectionsTab");
  const {
    collections,
    stats,
    isLoading,
    isLoadingMore,
    hasNextPage,
    sortOption,
    error,
    setSort,
    loadMore,
  } = usePlayerCollections(playerId, locale, isOwner);

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
    <section className="mb-8 space-y-6">
      {stats && <PlayerCollectionsStats stats={stats} />}

      {!isLoading && collections.length > 0 && (
        <div className="flex justify-end">
          <PlayerCollectionsSortSelect value={sortOption} onChange={setSort} />
        </div>
      )}

      <div role="feed" aria-busy={isBusy} aria-label={t("ariaLabel")}>
        {isLoading && <CollectionsFeedSkeleton />}

        {!isLoading && error && (
          <p className="py-8 text-center text-sm text-red-500 dark:text-red-400">{t("error")}</p>
        )}

        {!isLoading && !error && collections.length === 0 && <CollectionsFeedEmpty />}

        {!isLoading && collections.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                playerId={playerId}
                isOwner={isOwner}
              />
            ))}
          </div>
        )}

        {isLoadingMore && (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      </div>
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl bg-white/40 shadow-sm dark:bg-slate-800/50">
      <div className="aspect-[16/9] bg-gray-200 dark:bg-slate-700" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="h-2 w-1/3 rounded bg-gray-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

function CollectionsFeedSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function CollectionsFeedEmpty() {
  const t = useTranslations("players.collectionsTab");

  return (
    <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-12 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-slate-700/50">
        <FolderOpen className="h-10 w-10 text-gray-400 dark:text-slate-400" />
      </div>
      <p className="font-medium text-gray-500 dark:text-slate-400">{t("empty")}</p>
      <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">{t("emptyDescription")}</p>
    </div>
  );
}
