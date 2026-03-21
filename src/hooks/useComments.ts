"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import type { Comment, CommentFormData, CommentsResponse } from "@/types/comment";
import { CommentService } from "@/lib/services/commentService";

interface UseCommentsReturn {
  comments: Comment[];
  totalCount: number;
  userHasCommented: boolean;
  userComment: Comment | null;
  loading: boolean;
  error: string | null;
  submitting: boolean;
  fetchComments: () => Promise<void>;
  submitComment: (data: CommentFormData) => Promise<boolean>;
  updateComment: (data: CommentFormData) => Promise<boolean>;
}

/**
 * Hook pour gérer les commentaires d'un personnage.
 * SWR gère la lecture, les mutations passent par le CommentService.
 */
export function useComments(characterId: string): UseCommentsReturn {
  const [submitting, setSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Fetcher custom car CommentService retourne un format spécifique
  const { data, error, isLoading, mutate } = useSWR<CommentsResponse>(
    characterId ? ["comments", characterId] : null,
    () => CommentService.fetchComments(characterId)
  );

  const fetchComments = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const submitComment = useCallback(
    async (formData: CommentFormData): Promise<boolean> => {
      if (!characterId || submitting) return false;

      try {
        setSubmitting(true);
        setMutationError(null);
        await CommentService.submitComment(characterId, formData);
        await mutate();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to submit comment";
        setMutationError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [characterId, submitting, mutate]
  );

  const updateComment = useCallback(
    async (formData: CommentFormData): Promise<boolean> => {
      if (!characterId || submitting) return false;

      try {
        setSubmitting(true);
        setMutationError(null);
        await CommentService.updateComment(characterId, formData);
        await mutate();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update comment";
        setMutationError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [characterId, submitting, mutate]
  );

  const fetchError = error
    ? error instanceof Error
      ? error.message
      : "Failed to fetch comments"
    : null;

  return {
    comments: data?.comments ?? [],
    totalCount: data?.totalCount ?? 0,
    userHasCommented: data?.userHasCommented ?? false,
    userComment: data?.userComment ?? null,
    loading: isLoading,
    error: mutationError || fetchError,
    submitting,
    fetchComments,
    submitComment,
    updateComment,
  };
}
