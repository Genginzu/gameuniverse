"use client";

import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import type { GroupSummary } from "@/types/group";

interface MyGroupsResponse {
  groups: GroupSummary[];
}

interface UseMyGroupsReturn {
  groups: GroupSummary[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook SWR pour la liste des groupes dont l'utilisateur courant est membre,
 * triée alphabétiquement par nom (tri effectué côté serveur).
 */
export function useMyGroups(): UseMyGroupsReturn {
  const { user } = useAuth();

  const { data, error, isLoading } = useSWR<MyGroupsResponse>(
    user ? "/api/groups/mine" : null
  );

  return {
    groups: data?.groups ?? [],
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch my groups") : null,
  };
}
