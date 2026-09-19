"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { GroupService } from "@/lib/services/groupService";
import type { GroupDetail } from "@/types/group";

interface GroupResponse {
  group: GroupDetail;
}

interface UseGroupReturn {
  group: GroupDetail | null;
  isLoading: boolean;
  error: string | null;
  isLeaving: boolean;
  leave: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook SWR pour le détail d'un groupe, avec action quitter.
 * Les groupes sont invite-only : il n'y a pas d'action "rejoindre" publique,
 * seule l'acceptation d'une invitation (cf. useInvitation) ajoute un membre.
 */
export function useGroup(slug: string): UseGroupReturn {
  const { data, error, isLoading, mutate } = useSWR<GroupResponse>(
    slug ? `/api/groups/${slug}` : null
  );
  const [isLeaving, setIsLeaving] = useState(false);

  const leave = useCallback(async () => {
    setIsLeaving(true);
    try {
      await GroupService.leaveGroup(slug);
      await mutate();
    } finally {
      setIsLeaving(false);
    }
  }, [slug, mutate]);

  return {
    group: data?.group ?? null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch group") : null,
    isLeaving,
    leave,
    refetch: async () => {
      await mutate();
    },
  };
}
