"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminContentDescriptor } from "@/types/admin-age-classifications";

export interface UseAdminDescriptorsReturn {
  descriptors: AdminContentDescriptor[];
  loading: boolean;
  error: Error | null;
  fetchDescriptors: (search?: string) => Promise<void>;
  deleteDescriptor: (descriptorId: string) => Promise<void>;
  checkDescriptorUsage: (descriptorId: string) => Promise<number>;
  refetch: () => Promise<void>;
}

export function useAdminDescriptors(ratingSystemId: string): UseAdminDescriptorsReturn {
  const [descriptors, setDescriptors] = useState<AdminContentDescriptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastSearch, setLastSearch] = useState("");

  const fetchDescriptors = useCallback(
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

        const url = `/api/admin/age-classifications/${encodeURIComponent(ratingSystemId)}/descriptors?${searchParams.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Failed to fetch descriptors (${response.status})`);
        }

        const data = await response.json();
        setDescriptors(data.descriptors ?? []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    },
    [ratingSystemId]
  );

  const deleteDescriptor = useCallback(
    async (descriptorId: string) => {
      const response = await fetch(
        `/api/admin/age-classifications/${encodeURIComponent(ratingSystemId)}/descriptors/${encodeURIComponent(descriptorId)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete descriptor (${response.status})`);
      }

      await fetchDescriptors(lastSearch);
    },
    [ratingSystemId, fetchDescriptors, lastSearch]
  );

  const checkDescriptorUsage = useCallback(
    async (descriptorId: string): Promise<number> => {
      const response = await fetch(
        `/api/admin/age-classifications/${encodeURIComponent(ratingSystemId)}/descriptors/${encodeURIComponent(descriptorId)}`,
        { method: "DELETE" }
      );

      if (response.status === 409) {
        const body = await response.json().catch(() => ({}));
        return (body.usageCount as number) ?? 0;
      }

      if (response.ok) {
        await fetchDescriptors(lastSearch);
        return 0;
      }

      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Failed to check descriptor usage (${response.status})`);
    },
    [ratingSystemId, fetchDescriptors, lastSearch]
  );

  const refetch = useCallback(() => fetchDescriptors(lastSearch), [fetchDescriptors, lastSearch]);

  useEffect(() => {
    fetchDescriptors();
  }, [fetchDescriptors]);

  return {
    descriptors,
    loading,
    error,
    fetchDescriptors,
    deleteDescriptor,
    checkDescriptorUsage,
    refetch,
  };
}
