"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { GroupService } from "@/lib/services/groupService";
import type { GroupMember, GroupMemberRole } from "@/types/group";

interface GroupMembersResponse {
  members: GroupMember[];
}

interface UseGroupMembersReturn {
  members: GroupMember[];
  isLoading: boolean;
  error: string | null;
  updateRole: (playerId: string, role: GroupMemberRole) => Promise<void>;
  removeMember: (playerId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook SWR pour la liste des membres d'un groupe, avec actions de gestion
 * (changement de rôle, retrait) pour owner/admin.
 */
export function useGroupMembers(slug: string): UseGroupMembersReturn {
  const { data, error, isLoading, mutate } = useSWR<GroupMembersResponse>(
    slug ? `/api/groups/${slug}/members` : null
  );

  const updateRole = useCallback(
    async (playerId: string, role: GroupMemberRole) => {
      await GroupService.updateMember(slug, playerId, { role });
      await mutate();
    },
    [slug, mutate]
  );

  const removeMember = useCallback(
    async (playerId: string) => {
      await GroupService.removeMember(slug, playerId);
      await mutate();
    },
    [slug, mutate]
  );

  return {
    members: data?.members ?? [],
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch members") : null,
    updateRole,
    removeMember,
    refetch: async () => {
      await mutate();
    },
  };
}
