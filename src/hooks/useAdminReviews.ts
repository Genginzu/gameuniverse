"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminReview, FetchAdminReviewsParams } from "@/types/admin-reviews";
import type { PaginationInfo } from "@/types/pagination";

export interface UseAdminReviewsReturn {
  reviews: AdminReview[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchReviews: (params?: FetchAdminReviewsParams) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const DEFAULT_PAGINATION: PaginationInfo = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function useAdminReviews(): UseAdminReviewsReturn {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchAdminReviewsParams>({});

  const fetchReviews = useCallback(async (params: FetchAdminReviewsParams = {}) => {
    setLoading(true);
    setError(null);
    setLastParams(params);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set("page", String(params.page ?? 1));
      searchParams.set("limit", String(params.limit ?? 20));

      if (params.search?.trim()) {
        searchParams.set("search", params.search.trim());
      }
      if (params.sortBy) {
        searchParams.set("sort_by", params.sortBy);
      }
      if (params.sortOrder) {
        searchParams.set("sort_order", params.sortOrder);
      }

      const response = await fetch(`/api/admin/reviews?${searchParams.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch reviews (${response.status})`);
      }

      const data = await response.json();
      setReviews(data.reviews ?? []);
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReview = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete review (${response.status})`);
      }

      // Refetch current page after deletion
      await fetchReviews(lastParams);
    },
    [fetchReviews, lastParams]
  );

  const refetch = useCallback(() => fetchReviews(lastParams), [fetchReviews, lastParams]);

  // Initial fetch
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, pagination, loading, error, fetchReviews, deleteReview, refetch };
}
