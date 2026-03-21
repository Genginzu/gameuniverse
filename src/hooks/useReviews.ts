"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import type { Review, ReviewFormData, ReviewsResponse, ReviewWithVotes } from "@/types/review";
import { ReviewService } from "@/lib/services/reviewService";

interface UseReviewsReturn {
  reviews: ReviewWithVotes[];
  averageRating: number | null;
  totalCount: number;
  userHasReviewed: boolean;
  userReview: Review | null;
  loading: boolean;
  error: string | null;
  submitting: boolean;
  fetchReviews: () => Promise<void>;
  submitReview: (data: ReviewFormData) => Promise<boolean>;
  updateReview: (data: ReviewFormData) => Promise<boolean>;
}

/**
 * Hook pour gérer les reviews d'un jeu.
 * SWR gère la lecture, les mutations passent par le ReviewService.
 */
export function useReviews(gameId: string): UseReviewsReturn {
  const [submitting, setSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Fetcher custom car ReviewService retourne un format spécifique
  const { data, error, isLoading, mutate } = useSWR<ReviewsResponse>(
    gameId ? ["reviews", gameId] : null,
    () => ReviewService.fetchReviews(gameId)
  );

  const fetchReviews = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const submitReview = useCallback(
    async (formData: ReviewFormData): Promise<boolean> => {
      if (!gameId || submitting) return false;

      try {
        setSubmitting(true);
        setMutationError(null);
        await ReviewService.submitReview(gameId, formData);
        await mutate();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to submit review";
        setMutationError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [gameId, submitting, mutate]
  );

  const updateReview = useCallback(
    async (formData: ReviewFormData): Promise<boolean> => {
      if (!gameId || submitting) return false;

      try {
        setSubmitting(true);
        setMutationError(null);
        await ReviewService.updateReview(gameId, formData);
        await mutate();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update review";
        setMutationError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [gameId, submitting, mutate]
  );

  const fetchError = error
    ? error instanceof Error
      ? error.message
      : "Failed to fetch reviews"
    : null;

  return {
    reviews: data?.reviews ?? [],
    averageRating: data?.averageRating ?? null,
    totalCount: data?.totalCount ?? 0,
    userHasReviewed: data?.userHasReviewed ?? false,
    userReview: data?.userReview ?? null,
    loading: isLoading,
    error: mutationError || fetchError,
    submitting,
    fetchReviews,
    submitReview,
    updateReview,
  };
}
