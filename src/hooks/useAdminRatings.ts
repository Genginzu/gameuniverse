"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminRating } from "@/types/admin-age-classifications";

export interface UseAdminRatingsReturn {
  ratings: AdminRating[];
  loading: boolean;
  error: Error | null;
  fetchRatings: (search?: string) => Promise<void>;
  deleteRating: (ratingId: string) => Promise<void>;
  checkRatingUsage: (ratingId: string) => Promise<number>;
  refetch: () => Promise<void>;
}

export function useAdminRatings(ratingSystemId: string): UseAdminRatingsReturn {
  const [ratings, setRatings] = useState<AdminRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastSearch, setLastSearch] = useState("");

  const fetchRatings = useCallback(
    async (search?: string) => {
      if (!ratingSystemId) return;

      setLoading(true);
      setError(null);
      setLastSearch(search ?? "");

      try {
        const searchParams = new URLSearchParams();
        if (search?.trim()) {
          searchParams.set("search", search.trim());
        }

        const url = `/api/admin/age-classifications/${encodeURIComponent(ratingSystemId)}/ratings?${searchParams.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Failed to fetch ratings (${response.status})`);
        }

        const data = await response.json();
        setRatings(data.ratings ?? []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    },
    [ratingSystemId]
  );

  const deleteRating = useCallback(
    async (ratingId: string) => {
      const response = await fetch(
        `/api/admin/age-classifications/${encodeURIComponent(ratingSystemId)}/ratings/${encodeURIComponent(ratingId)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete rating (${response.status})`);
      }

      await fetchRatings(lastSearch);
    },
    [ratingSystemId, fetchRatings, lastSearch]
  );

  const checkRatingUsage = useCallback(
    async (ratingId: string): Promise<number> => {
      const response = await fetch(
        `/api/admin/age-classifications/${encodeURIComponent(ratingSystemId)}/ratings/${encodeURIComponent(ratingId)}`,
        { method: "DELETE" }
      );

      if (response.status === 409) {
        const body = await response.json().catch(() => ({}));
        return (body.usageCount as number) ?? 0;
      }

      if (response.ok) {
        await fetchRatings(lastSearch);
        return 0;
      }

      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Failed to check rating usage (${response.status})`);
    },
    [ratingSystemId, fetchRatings, lastSearch]
  );

  const refetch = useCallback(() => fetchRatings(lastSearch), [fetchRatings, lastSearch]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  return { ratings, loading, error, fetchRatings, deleteRating, checkRatingUsage, refetch };
}
