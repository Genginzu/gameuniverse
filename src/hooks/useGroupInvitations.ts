"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { GroupService } from "@/lib/services/groupService";
import type { CreateGroupInvitationInput, GroupInvitation } from "@/types/group";

interface GroupInvitationsResponse {
  invitations: GroupInvitation[];
}

interface UseGroupInvitationsReturn {
  invitations: GroupInvitation[];
  isLoading: boolean;
  error: string | null;
  isInviting: boolean;
  inviteError: string | null;
  invite: (input: CreateGroupInvitationInput) => Promise<void>;
}

/**
 * Hook SWR pour les invitations d'un groupe (vue owner/admin) : liste +
 * création d'une nouvelle invitation par email ou pseudo.
 */
export function useGroupInvitations(slug: string, enabled: boolean): UseGroupInvitationsReturn {
  const { data, error, isLoading, mutate } = useSWR<GroupInvitationsResponse>(
    enabled && slug ? `/api/groups/${slug}/invitations` : null
  );
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const invite = useCallback(
    async (input: CreateGroupInvitationInput) => {
      setIsInviting(true);
      setInviteError(null);
      try {
        await GroupService.createInvitation(slug, input);
        await mutate();
      } catch (err) {
        setInviteError(err instanceof Error ? err.message : "Failed to send invitation");
        throw err;
      } finally {
        setIsInviting(false);
      }
    },
    [slug, mutate]
  );

  return {
    invitations: data?.invitations ?? [],
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch invitations"
      : null,
    isInviting,
    inviteError,
    invite,
  };
}
