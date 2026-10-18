"use client";

import useSWR from "swr";
import { buildCommunitiesUrl } from "@/lib/services/communityService";
import type { CommunityListResponse, CommunitySearchParams } from "@/types/community";

interface UseCommunitiesReturn {
  communities: CommunityListResponse["communities"];
  pagination: CommunityListResponse["pagination"] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook SWR pour la recherche/listing des communautés thématiques.
 * SWR gère le cache, la déduplication et la revalidation.
 */
export function useCommunities(params: CommunitySearchParams = {}): UseCommunitiesReturn {
  const url = buildCommunitiesUrl(params);

  const { data, error, isLoading, mutate } = useSWR<CommunityListResponse>(url);

  return {
    communities: data?.communities ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch communities") : null,
    refetch: async () => {
      await mutate();
    },
  };
}
