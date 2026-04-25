"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { PostCard } from "./PostCard";
import { SkeletonCards, PostsFeedEmpty } from "../layouts/PostsFeedParts";
import type { usePlayerPosts } from "@/hooks/usePlayerPosts";

interface PostsFeedColumnProps {
  postHook: ReturnType<typeof usePlayerPosts>;
  playerName: string | null;
  playerAvatar: string | null;
  locale: string;
  isOwner: boolean;
}

export function PostsFeedColumn({
  postHook,
  playerName,
  playerAvatar,
  locale,
  isOwner,
}: PostsFeedColumnProps) {
  const t = useTranslations("players.posts");
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && postHook.hasNextPage && !postHook.isLoadingMore) {
          postHook.loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [postHook.hasNextPage, postHook.isLoadingMore, postHook.loadMore]);

  return (
    <div
      role="feed"
      aria-busy={postHook.isLoading || postHook.isLoadingMore}
      aria-label={t("feedLabel")}
    >
      {postHook.isLoading && <SkeletonCards count={3} />}

      {!postHook.isLoading && postHook.error && (
        <p className="py-8 text-center text-sm text-red-500 dark:text-red-400">{t("error")}</p>
      )}

      {!postHook.isLoading &&
        !postHook.error &&
        postHook.posts.length === 0 &&
        postHook.searchTerm && (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
            {t("noResults", { term: postHook.searchTerm })}
          </p>
        )}

      {!postHook.isLoading &&
        !postHook.error &&
        postHook.posts.length === 0 &&
        !postHook.searchTerm && <PostsFeedEmpty />}

      {!postHook.isLoading && postHook.posts.length > 0 && (
        <div className="relative ml-6 border-l-2 border-palette-primary-300/50 pl-6 dark:border-palette-primary-500/30">
          {postHook.posts.map((post) => (
            <div key={post.id} className="relative mb-6">
              <div className="absolute -left-[33px] top-5 h-4 w-4 rounded-full border-2 border-palette-primary-400 bg-white dark:border-palette-primary-500 dark:bg-slate-800" />
              <PostCard
                post={post}
                playerName={playerName}
                playerAvatar={playerAvatar}
                locale={locale}
                isOwner={isOwner}
                onDelete={postHook.deletePost}
              />
            </div>
          ))}
        </div>
      )}

      {postHook.isLoadingMore && <SkeletonCards count={2} />}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
    </div>
  );
}
