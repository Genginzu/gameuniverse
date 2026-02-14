"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Review, ReviewFormData, ReviewsResponse } from "@/types/review";
import { ReviewService } from "@/lib/services/reviewService";

interface UseReviewsReturn {
  reviews: Review[];
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
 * Gère le chargement, la soumission, et l'état optimiste.
 */
export function useReviews(gameId: string): UseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const hasFetchedRef = useRef(false);

  const applyResponse = useCallback((response: ReviewsResponse) => {
    setReviews(response.reviews);
    setAverageRating(response.averageRating);
    setTotalCount(response.totalCount);
    setUserHasReviewed(response.userHasReviewed);
    setUserReview(response.userReview ?? null);
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!gameId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await ReviewService.fetchReviews(gameId);
      applyResponse(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch reviews";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [gameId, applyResponse]);

  const submitReview = useCallback(
    async (data: ReviewFormData): Promise<boolean> => {
      if (!gameId || submitting) return false;

      try {
        setSubmitting(true);
        setError(null);
        await ReviewService.submitReview(gameId, data);

        // Rafraîchir les reviews après soumission réussie
        await fetchReviews();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to submit review";
        setError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [gameId, submitting, fetchReviews]
  );

  const updateReview = useCallback(
    async (data: ReviewFormData): Promise<boolean> => {
      if (!gameId || submitting) return false;

      try {
        setSubmitting(true);
        setError(null);
        await ReviewService.updateReview(gameId, data);
        await fetchReviews();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update review";
        setError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [gameId, submitting, fetchReviews]
  );

  // Chargement initial — une seule fois
  useEffect(() => {
    if (hasFetchedRef.current || !gameId) {
      if (!gameId) setLoading(false);
      return;
    }
    hasFetchedRef.current = true;
    fetchReviews();
  }, [gameId, fetchReviews]);

  return {
    reviews,
    averageRating,
    totalCount,
    userHasReviewed,
    userReview,
    loading,
    error,
    submitting,
    fetchReviews,
    submitReview,
    updateReview,
  };
}
