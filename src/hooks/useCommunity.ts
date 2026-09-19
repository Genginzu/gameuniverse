"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { CommunityService } from "@/lib/services/communityService";
import type { CommunityDetail } from "@/types/community";

interface CommunityResponse {
  community: CommunityDetail;
}

interface UseCommunityReturn {
  community: CommunityDetail | null;
  isLoading: boolean;
  error: string | null;
  isJoining: boolean;
  isLeaving: boolean;
  join: () => Promise<void>;
  leave: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook SWR pour le détail d'une communauté, avec actions rejoindre/quitter.
 */
export function useCommunity(slug: string): UseCommunityReturn {
  const { data, error, isLoading, mutate } = useSWR<CommunityResponse>(
    slug ? `/api/communities/${slug}` : null
  );
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const join = useCallback(async () => {
    setIsJoining(true);
    try {
      await CommunityService.joinCommunity(slug);
      await mutate();
    } finally {
      setIsJoining(false);
    }
  }, [slug, mutate]);

  const leave = useCallback(async () => {
    setIsLeaving(true);
    try {
      await CommunityService.leaveCommunity(slug);
      await mutate();
    } finally {
      setIsLeaving(false);
    }
  }, [slug, mutate]);

  return {
    community: data?.community ?? null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch community") : null,
    isJoining,
    isLeaving,
    join,
    leave,
    refetch: async () => {
      await mutate();
    },
  };
}
