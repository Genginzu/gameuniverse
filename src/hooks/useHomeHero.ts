"use client";

import useSWR from "swr";
import type { User } from "@supabase/supabase-js";

import type { PlayerXpStats } from "@/types/achievement";
import type { LibraryStats } from "@/types/library";
import type { Profile } from "@/types/profile";
import { useLibraryStats } from "./useLibraryStats";

interface ProfileResponse {
  profile: Profile;
}

export interface HomeHeroData {
  displayName: string;
  avatarUrl: string | null;
  xp: PlayerXpStats | null;
  stats: LibraryStats | null;
  isLoading: boolean;
}

function fallbackDisplayName(user: User): string {
  const metadataName = user.user_metadata?.username;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName;
  return user.email?.split("@")[0] ?? "";
}

/** Identity, level and library stats shown in the logged-in home hero. */
export function useHomeHero(user: User): HomeHeroData {
  const { data: profileData } = useSWR<ProfileResponse>("/api/profile", { onError: () => {} });
  const { data: xp, isLoading: xpLoading } = useSWR<PlayerXpStats>(
    `/api/players/${user.id}/xp`,
    { onError: () => {} }
  );
  const { stats, isLoading: statsLoading } = useLibraryStats();

  const profile = profileData?.profile;

  return {
    displayName: profile?.username || fallbackDisplayName(user),
    avatarUrl: profile?.avatar_url ?? null,
    xp: xp ?? null,
    stats,
    isLoading: xpLoading || statsLoading,
  };
}
