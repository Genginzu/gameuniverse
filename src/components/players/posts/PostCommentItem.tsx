"use client";

import { useTranslations, useFormatter } from "next-intl";
import { Icon } from "@iconify/react";
import { LazyImage } from "@/components/ui/lazy-image";
import type { PostComment } from "@/types/post-comment";

interface PostCommentItemProps {
  comment: PostComment;
  isOwner: boolean;
  onDelete: (commentId: string) => void;
}

export function PostCommentItem({ comment, isOwner, onDelete }: PostCommentItemProps) {
  const t = useTranslations("postComments");
  const format = useFormatter();

  const createdAt = new Date(comment.createdAt);
  const now = new Date();
  const safeDate = createdAt > now ? now : createdAt;
  const relativeDate = format.relativeTime(safeDate, now);
  const displayName = comment.player?.username ?? "?";
  const avatarUrl = comment.player?.avatarUrl ?? null;

  return (
    <article
      role="article"
      className="flex gap-3 rounded-xl bg-white/50 p-3 transition-colors dark:bg-slate-700/30"
    >
      {/* Avatar */}
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
        {avatarUrl ? (
          <LazyImage
            src={avatarUrl}
            alt={displayName}
            fill
            className="object-cover"
            sizes="32px"
            showSkeleton
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon icon="lucide:user" className="h-4 w-4 text-blue-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {displayName}
          </span>
          <time
            dateTime={comment.createdAt}
            className="shrink-0 text-xs text-gray-400 dark:text-slate-500"
            suppressHydrationWarning
          >
            {relativeDate}
          </time>
        </div>
        <p className="mt-0.5 text-sm break-words text-gray-700 dark:text-slate-300">
          {comment.content}
        </p>
      </div>

      {/* Delete button */}
      {isOwner && (
        <button
          type="button"
          onClick={() => onDelete(comment.id)}
          className="shrink-0 self-start rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          aria-label={t("deleteLabel")}
        >
          <Icon icon="lucide:trash-2" className="h-4 w-4" />
        </button>
      )}
    </article>
  );
}
