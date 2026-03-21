"use client";

import { useEffect, useRef } from "react";
import { usePlayerPosts } from "@/hooks/usePlayerPosts";
import { PostsLayoutTimelineV2 } from "../layouts/PostsLayoutTimelineV2";

interface PostsFeedProps {
  playerId: string;
  playerName: string | null;
  playerAvatar: string | null;
  locale: string;
  isOwner: boolean;
}

export function PostsFeed({ playerId, playerName, playerAvatar, locale, isOwner }: PostsFeedProps) {
  const hook = usePlayerPosts(playerId);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hook.hasNextPage && !hook.isLoadingMore) {
          hook.loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hook.hasNextPage, hook.isLoadingMore, hook.loadMore]);

  return (
    <PostsLayoutTimelineV2
      {...hook}
      playerId={playerId}
      playerName={playerName}
      playerAvatar={playerAvatar}
      locale={locale}
      isOwner={isOwner}
      sentinelRef={sentinelRef}
    />
  );
}
