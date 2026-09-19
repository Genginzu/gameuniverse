"use client";

import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import type { CommunitySummary } from "@/types/community";

interface MyCommunitiesResponse {
  communities: CommunitySummary[];
}

interface UseMyCommunitiesReturn {
  communities: CommunitySummary[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook SWR pour la liste des communautés dont l'utilisateur courant est
 * membre, triée alphabétiquement par nom (tri effectué côté serveur).
 */
export function useMyCommunities(): UseMyCommunitiesReturn {
  const { user } = useAuth();

  const { data, error, isLoading } = useSWR<MyCommunitiesResponse>(
    user ? "/api/communities/mine" : null
  );

  return {
    communities: data?.communities ?? [],
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch my communities"
      : null,
  };
}
