"use client";

import { memo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/components/ui/skeleton";
import { FriendCard } from "./FriendCard";
import type { FriendSummary } from "@/types/friendship";

interface FriendListProps {
  friends: FriendSummary[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onRemove?: (friendshipId: string) => Promise<void>;
  locale: string;
}

export const FriendList = memo(function FriendList({
  friends,
  isLoading,
  isLoadingMore,
  hasNextPage,
  onLoadMore,
  onRemove,
  locale,
}: FriendListProps) {
  const t = useTranslations("friends");
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isLoadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isLoadingMore, onLoadMore]);

  if (isLoading) {
    return <FriendListSkeleton />;
  }

  if (friends.length === 0) {
    return <FriendListEmpty />;
  }

  return (
    <div>
      <div
        role="list"
        aria-label={t("listLabel")}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
      >
        {friends.map((friend) => (
          <div key={friend.friendshipId} role="listitem">
            <FriendCard friend={friend} locale={locale} onRemove={onRemove} />
          </div>
        ))}
      </div>

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-[0.875rem] bg-white/[0.06]" />
          ))}
        </div>
      )}

      {/* Sentinel for IntersectionObserver */}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
    </div>
  );
});

function FriendListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-[0.875rem] bg-white/[0.06]" />
      ))}
    </div>
  );
}

function FriendListEmpty() {
  const t = useTranslations("friends");

  return (
    <div className="border-editorial-line bg-editorial-3 flex flex-col items-center justify-center rounded-[1.25rem] border border-dashed px-8 py-12 text-center">
      <div className="bg-editorial-accent/12 text-editorial-accent mb-4 grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:users" className="h-10 w-10" aria-hidden="true" />
      </div>
      <p className="text-editorial-muted text-sm">{t("empty")}</p>
    </div>
  );
}
