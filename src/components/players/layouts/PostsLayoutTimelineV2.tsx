"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { PostComposer } from "../PostComposer";
import { PostCard } from "../PostCard";
import { SearchBar } from "../SearchBar";
import { SkeletonCards, PostsFeedEmpty } from "./PostsFeedParts";
import type { Post } from "@/types/post";

export interface PostsLayoutProps {
  posts: Post[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isCreating: boolean;
  hasNextPage: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  createPost: (content: string, imageUrl?: string, tags?: string[]) => Promise<void>;
  deletePost: (postId: string) => void;
  playerId: string;
  playerName: string | null;
  playerAvatar: string | null;
  locale: string;
  isOwner: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

/** Variante 6 — Timeline v2 : barre de recherche + bouton "Nouveau post" */
export function PostsLayoutTimelineV2(props: PostsLayoutProps) {
  const t = useTranslations("players.posts");
  const [showComposer, setShowComposer] = useState(false);

  const {
    posts,
    isLoading,
    isLoadingMore,
    isCreating,
    error,
    searchTerm,
    setSearchTerm,
    createPost,
    deletePost,
    playerId,
    playerName,
    playerAvatar,
    locale,
    isOwner,
    sentinelRef,
  } = props;

  const handlePostCreated = async (content: string, imageUrl?: string, tags?: string[]) => {
    await createPost(content, imageUrl, tags);
    setShowComposer(false);
  };

  return (
    <section className="mb-8 space-y-4">
      {/* Top bar: search + new post button */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => setShowComposer((v) => !v)}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-linear-to-br from-violet-500 to-blue-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:opacity-90"
          >
            {showComposer ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {t("newPost")}
          </button>
        )}
      </div>

      {/* Composer (toggled) */}
      {isOwner && showComposer && (
        <div className="mx-auto max-w-2xl">
          <PostComposer
            playerId={playerId}
            playerAvatar={playerAvatar}
            isCreating={isCreating}
            onSubmit={handlePostCreated}
            onPostCreated={() => {}}
          />
        </div>
      )}

      {/* Timeline feed */}
      <div role="feed" aria-busy={isLoading || isLoadingMore} aria-label={t("feedLabel")}>
        {isLoading && <SkeletonCards count={3} />}

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
          <div className="relative ml-6 border-l-2 border-violet-300/50 pl-6 dark:border-violet-500/30">
            {posts.map((post) => (
              <div key={post.id} className="relative mb-6">
                {/* Timeline dot */}
                <div className="absolute top-5 -left-[33px] h-4 w-4 rounded-full border-2 border-violet-400 bg-white dark:border-violet-500 dark:bg-slate-800" />
                <PostCard
                  post={post}
                  playerName={playerName}
                  playerAvatar={playerAvatar}
                  locale={locale}
                  isOwner={isOwner}
                  onDelete={deletePost}
                />
              </div>
            ))}
          </div>
        )}

        {isLoadingMore && <SkeletonCards count={2} />}
        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      </div>
    </section>
  );
}
