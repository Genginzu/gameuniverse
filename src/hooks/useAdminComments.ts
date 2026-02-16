"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminComment, FetchAdminCommentsParams } from "@/types/admin-comments";
import type { PaginationInfo } from "@/types/pagination";

export interface UseAdminCommentsReturn {
  comments: AdminComment[];
  pagination: PaginationInfo;
  loading: boolean;
  error: Error | null;
  fetchComments: (params?: FetchAdminCommentsParams) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
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

export function useAdminComments(): UseAdminCommentsReturn {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<FetchAdminCommentsParams>({});

  const fetchComments = useCallback(async (params: FetchAdminCommentsParams = {}) => {
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

      const response = await fetch(`/api/admin/comments?${searchParams.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch comments (${response.status})`);
      }

      const data = await response.json();
      setComments(data.comments ?? []);
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteComment = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete comment (${response.status})`);
      }

      // Refetch current page after deletion
      await fetchComments(lastParams);
    },
    [fetchComments, lastParams]
  );

  const refetch = useCallback(() => fetchComments(lastParams), [fetchComments, lastParams]);

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, pagination, loading, error, fetchComments, deleteComment, refetch };
}
