"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
 * Gère le chargement, la soumission, la modification et les états.
 */
export function useComments(characterId: string): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [userHasCommented, setUserHasCommented] = useState(false);
  const [userComment, setUserComment] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const hasFetchedRef = useRef(false);

  const applyResponse = useCallback((response: CommentsResponse) => {
    setComments(response.comments);
    setTotalCount(response.totalCount);
    setUserHasCommented(response.userHasCommented);
    setUserComment(response.userComment ?? null);
  }, []);

  const fetchComments = useCallback(async () => {
    if (!characterId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await CommentService.fetchComments(characterId);
      applyResponse(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch comments";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [characterId, applyResponse]);

  const submitComment = useCallback(
    async (data: CommentFormData): Promise<boolean> => {
      if (!characterId || submitting) return false;

      try {
        setSubmitting(true);
        setError(null);
        await CommentService.submitComment(characterId, data);
        await fetchComments();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to submit comment";
        setError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [characterId, submitting, fetchComments]
  );

  const updateComment = useCallback(
    async (data: CommentFormData): Promise<boolean> => {
      if (!characterId || submitting) return false;

      try {
        setSubmitting(true);
        setError(null);
        await CommentService.updateComment(characterId, data);
        await fetchComments();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update comment";
        setError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [characterId, submitting, fetchComments]
  );

  // Chargement initial — une seule fois
  useEffect(() => {
    if (hasFetchedRef.current || !characterId) {
      if (!characterId) setLoading(false);
      return;
    }
    hasFetchedRef.current = true;
    fetchComments();
  }, [characterId, fetchComments]);

  return {
    comments,
    totalCount,
    userHasCommented,
    userComment,
    loading,
    error,
    submitting,
    fetchComments,
    submitComment,
    updateComment,
  };
}
