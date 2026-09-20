"use client";

import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import type { GroupInvitationWithGroup } from "@/types/group";

interface MyInvitationsResponse {
  invitations: GroupInvitationWithGroup[];
}

interface UseMyInvitationsReturn {
  invitations: GroupInvitationWithGroup[];
  isLoading: boolean;
  error: string | null;
}

/** Hook SWR pour les invitations de groupe en attente adressées au joueur courant. */
export function useMyInvitations(): UseMyInvitationsReturn {
  const { user } = useAuth();

  const { data, error, isLoading } = useSWR<MyInvitationsResponse>(
    user ? "/api/invitations/mine" : null
  );

  return {
    invitations: data?.invitations ?? [],
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch invitations"
      : null,
  };
}
