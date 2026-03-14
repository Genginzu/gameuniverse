"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { MessageSquareOff } from "lucide-react";
import { usePlayerPosts } from "@/hooks/usePlayerPosts";
import { PostComposer } from "./PostComposer";
import { PostCard } from "./PostCard";
import { SearchBar } from "./SearchBar";

interface PostsFeedProps {
  playerId: string;
  playerName: string | null;
  playerAvatar: string | null;
  locale: string;
  isOwner: boolean;
}

export function PostsFeed({ playerId, playerName, playerAvatar, locale, isOwner }: PostsFeedProps) {
  const t = useTranslations("players.posts");
  const {
    posts,
    isLoading,
    isLoadingMore,
    isCreating,
    hasNextPage,
    error,
    searchTerm,
    setSearchTerm,
    loadMore,
    createPost,
    deletePost,
  } = usePlayerPosts(playerId);

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
    <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Left column: search + composer (sticky) */}
      <div className="space-y-4 lg:sticky lg:top-24 lg:col-span-2 lg:self-start">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />

        {isOwner && (
          <PostComposer
            playerId={playerId}
            playerAvatar={playerAvatar}
            isCreating={isCreating}
            onSubmit={createPost}
            onPostCreated={() => {}}
          />
        )}
      </div>

      {/* Right column: posts feed */}
      <div className="lg:col-span-3">
        <div role="feed" aria-busy={isBusy} aria-label={t("feedLabel")}>
          {isLoading && <PostsFeedSkeleton />}

          {!isLoading && error && (
            <p className="py-8 text-center text-sm text-red-500 dark:text-red-400">{t("error")}</p>
          )}

          {!isLoading && !error && posts.length === 0 && searchTerm && (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
              {t("noResults", { term: searchTerm })}
            </p>
          )}

          {!isLoading && !error && posts.length === 0 && !searchTerm && <PostsFeedEmpty />}

          {!isLoading && posts.length > 0 && (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  playerName={playerName}
                  playerAvatar={playerAvatar}
                  locale={locale}
                  isOwner={isOwner}
                  onDelete={deletePost}
                />
              ))}
            </div>
          )}

          {isLoadingMore && (
            <div className="mt-4 space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          <div ref={sentinelRef} className="h-1" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-white/80 p-5 shadow-md backdrop-blur-xl dark:bg-slate-800/60 dark:shadow-lg dark:shadow-black/20">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-700" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="h-2.5 w-20 rounded bg-gray-200 dark:bg-slate-700" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-200 dark:bg-slate-700" />
        <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

function PostsFeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function PostsFeedEmpty() {
  const t = useTranslations("players.posts");

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white/80 py-12 text-center shadow-md backdrop-blur-xl dark:bg-slate-800/60 dark:shadow-lg dark:shadow-black/20">
      <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-slate-700/50">
        <MessageSquareOff className="h-10 w-10 text-gray-400 dark:text-slate-400" />
      </div>
      <p className="text-sm text-gray-500 dark:text-slate-400">{t("empty")}</p>
    </div>
  );
}
