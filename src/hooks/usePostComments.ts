"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { PostCommentService } from "@/lib/services/postCommentService";
import type { PostComment, PostCommentsResponse } from "@/types/post-comment";

export interface UsePostCommentsReturn {
  comments: PostComment[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  addComment: (content: string) => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<boolean>;
}

export function usePostComments(postId: string): UsePostCommentsReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data,
    isLoading,
    error: swrError,
    mutate,
  } = useSWR<PostCommentsResponse>(
    postId ? `/api/posts/${postId}/comments` : null,
    () => PostCommentService.fetchComments(postId),
    { onError: () => {} }
  );

  const comments = data?.comments ?? [];
  const totalCount = data?.totalCount ?? 0;
  const error = swrError
    ? swrError instanceof Error
      ? swrError.message
      : "Failed to fetch comments"
    : null;

  const addComment = useCallback(
    async (content: string): Promise<boolean> => {
      setIsSubmitting(true);
      try {
        await PostCommentService.createComment(postId, content);
        await mutate();
        return true;
      } catch {
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [postId, mutate]
  );

  const deleteComment = useCallback(
    async (commentId: string): Promise<boolean> => {
      try {
        await PostCommentService.deleteComment(postId, commentId);
        await mutate();
        return true;
      } catch {
        return false;
      }
    },
    [postId, mutate]
  );

  return {
    comments,
    totalCount,
    isLoading,
    error,
    isSubmitting,
    addComment,
    deleteComment,
  };
}
