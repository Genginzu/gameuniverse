"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { CommunityService } from "@/lib/services/communityService";
import type { CommunityMember, CommunityMemberRole } from "@/types/community";

interface CommunityMembersResponse {
  members: CommunityMember[];
}

interface UseCommunityMembersReturn {
  members: CommunityMember[];
  isLoading: boolean;
  error: string | null;
  updateRole: (playerId: string, role: CommunityMemberRole) => Promise<void>;
  removeMember: (playerId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook SWR pour la liste des membres d'une communauté, avec actions de gestion
 * (changement de rôle, retrait) pour owner/moderator.
 */
export function useCommunityMembers(slug: string): UseCommunityMembersReturn {
  const { data, error, isLoading, mutate } = useSWR<CommunityMembersResponse>(
    slug ? `/api/communities/${slug}/members` : null
  );

  const updateRole = useCallback(
    async (playerId: string, role: CommunityMemberRole) => {
      await CommunityService.updateMember(slug, playerId, { role });
      await mutate();
    },
    [slug, mutate]
  );

  const removeMember = useCallback(
    async (playerId: string) => {
      await CommunityService.removeMember(slug, playerId);
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
