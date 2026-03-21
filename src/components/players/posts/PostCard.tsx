"use client";

import { useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { Icon } from "@iconify/react";
import { LazyImage } from "@/components/ui/lazy-image";
import type { Post } from "@/types/post";
import Image from "next/image";
import { PostContentRenderer } from "@/components/players/posts/PostContentRenderer";

interface PostCardProps {
  post: Post;
  playerName: string | null;
  playerAvatar: string | null;
  locale: string;
  isOwner: boolean;
  onDelete: (postId: string) => void;
}

export function PostCard({
  post,
  playerName,
  playerAvatar,
  locale,
  isOwner,
  onDelete,
}: PostCardProps) {
  const t = useTranslations("players.posts");
  const format = useFormatter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  const createdAt = new Date(post.createdAt);
  const now = new Date();
  const safeDate = createdAt > now ? now : createdAt;
  const relativeDate = format.relativeTime(safeDate, now);
  const displayName = playerName || t("anonymousPlayer");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(post.id);
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  return (
    <article className="rounded-2xl bg-white/80 p-5 shadow-md backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-800/60 dark:shadow-lg dark:shadow-black/20 dark:hover:shadow-xl dark:hover:shadow-black/30">
      {/* Header: avatar + name + time + menu */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <PostAvatar src={playerAvatar} alt={displayName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {displayName}
            </p>
            <time
              dateTime={post.createdAt}
              className="text-xs text-gray-400 dark:text-slate-500"
              suppressHydrationWarning
            >
              {relativeDate}
            </time>
          </div>
        </div>

        {isOwner && (
          <PostMenu
            showMenu={showMenu}
            isDeleting={isDeleting}
            onToggle={() => setShowMenu((v) => !v)}
            onCancel={() => setShowMenu(false)}
            onConfirm={handleDelete}
            t={t}
          />
        )}
      </div>

      {/* Content */}
      <div className="pl-[52px]">
        {/* Image above text */}
        {post.imageUrl && !imageError && (
          <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-xl">
            <Image
              src={post.imageUrl}
              alt=""
              fill
              onError={() => setImageError(true)}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
        )}

        <PostContentRenderer
          content={post.content}
          tags={post.tags}
          mentions={post.mentions}
          locale={locale}
        />

        {/* Tags displayed as pills below text */}
        {post.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-500 dark:bg-violet-400/10 dark:text-violet-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

/** Reusable avatar circle for posts */
function PostAvatar({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
      {src ? (
        <LazyImage src={src} alt={alt} fill className="object-cover" sizes="40px" showSkeleton />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Icon icon="lucide:user" className="h-5 w-5 text-blue-300" />
        </div>
      )}
    </div>
  );
}

/** Three-dot menu with delete confirmation */
function PostMenu({
  showMenu,
  isDeleting,
  onToggle,
  onCancel,
  onConfirm,
  t,
}: {
  showMenu: boolean;
  isDeleting: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  t: (key: string) => string;
}) {
  if (!showMenu) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700/50 dark:hover:text-slate-300"
        aria-label={t("deleteLabel")}
      >
        <Icon icon="lucide:more-horizontal" className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg px-2.5 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700"
      >
        {t("deleteCancel")}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isDeleting}
        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
      >
        {isDeleting && <Icon icon="lucide:loader-2" className="h-3 w-3 animate-spin" />}
        <Icon icon="lucide:trash-2" className="h-3 w-3" />
        {t("deleteConfirm")}
      </button>
    </div>
  );
}
