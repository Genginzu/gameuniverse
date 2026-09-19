"use client";

import useSWR from "swr";
import { buildGroupsUrl } from "@/lib/services/groupService";
import type { GroupListResponse, GroupSearchParams } from "@/types/group";

interface UseGroupsReturn {
  groups: GroupListResponse["groups"];
  pagination: GroupListResponse["pagination"] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook SWR pour la recherche/listing des groupes thématiques.
 * SWR gère le cache, la déduplication et la revalidation.
 */
export function useGroups(params: GroupSearchParams = {}): UseGroupsReturn {
  const url = buildGroupsUrl(params);

  const { data, error, isLoading, mutate } = useSWR<GroupListResponse>(url);

  return {
    groups: data?.groups ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch groups") : null,
    refetch: async () => {
      await mutate();
    },
  };
}
