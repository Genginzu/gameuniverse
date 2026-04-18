"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { usePostComments } from "@/hooks/usePostComments";
import { PostCommentItem } from "@/components/players/posts/PostCommentItem";
import { PostCommentForm } from "@/components/players/posts/PostCommentForm";

interface PostCommentSectionProps {
  postId: string;
  isPostOwner: boolean;
  isAuthenticated: boolean;
  currentPlayerId?: string;
}

export function PostCommentSection({
  postId,
  isPostOwner,
  isAuthenticated,
  currentPlayerId,
}: PostCommentSectionProps) {
  const t = useTranslations("postComments");
  const { comments, totalCount, isLoading, isSubmitting, addComment, deleteComment } =
    usePostComments(postId);

  return (
    <div className="mt-3 border-t border-gray-200/50 pt-3 dark:border-slate-700/50">
      {/* Header with comment count */}
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300">
        <Icon icon="lucide:message-circle" className="h-4 w-4" />
        {t("title")} ({totalCount})
      </h3>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Icon
            icon="lucide:loader-2"
            className="h-5 w-5 animate-spin text-gray-400 dark:text-slate-500"
          />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-3 text-center text-sm text-gray-400 dark:text-slate-500">
          {t("noComments")}
        </p>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => (
            <PostCommentItem
              key={comment.id}
              comment={comment}
              isOwner={isPostOwner || comment.playerId === currentPlayerId}
              onDelete={deleteComment}
            />
          ))}
        </div>
      )}

      {/* Comment form for authenticated users */}
      {isAuthenticated && (
        <div className="mt-3">
          <PostCommentForm onSubmit={addComment} isSubmitting={isSubmitting} />
        </div>
      )}
    </div>
  );
}
