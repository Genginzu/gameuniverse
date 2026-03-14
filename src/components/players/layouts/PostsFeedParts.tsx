"use client";

import { useTranslations } from "next-intl";
import { MessageSquareOff } from "lucide-react";
import { PostCard } from "../PostCard";
import type { Post } from "@/types/post";

interface FeedContentProps {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  playerName: string | null;
  playerAvatar: string | null;
  locale: string;
  isOwner: boolean;
  onDelete: (postId: string) => void;
  className?: string;
}

/** Renders the feed content: loading, error, empty, or posts list */
export function FeedContent({
  posts,
  isLoading,
  error,
  searchTerm,
  playerName,
  playerAvatar,
  locale,
  isOwner,
  onDelete,
  className = "space-y-4",
}: FeedContentProps) {
  const t = useTranslations("players.posts");

  if (isLoading) return <SkeletonCards count={3} />;

  if (error) {
    return <p className="py-8 text-center text-sm text-red-500 dark:text-red-400">{t("error")}</p>;
  }

  if (posts.length === 0 && searchTerm) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
        {t("noResults", { term: searchTerm })}
      </p>
    );
  }

  if (posts.length === 0) return <PostsFeedEmpty />;

  return (
    <div className={className}>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          playerName={playerName}
          playerAvatar={playerAvatar}
          locale={locale}
          isOwner={isOwner}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export function SkeletonCards({ count }: { count: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
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

export function PostsFeedEmpty() {
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
