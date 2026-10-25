"use client";

import useSWR from "swr";

import { fetcher } from "@/lib/swr/fetcher";
import type { AdminMetadataOptions } from "@/types/game-metadata";

const EMPTY: AdminMetadataOptions = { themes: [], game_modes: [], player_perspectives: [] };

/** Themes, game modes and perspectives offered by the admin game form. */
export function useAdminGameMetadataOptions() {
  const { data, isLoading, error } = useSWR<AdminMetadataOptions>("/api/admin/game-metadata", fetcher, {
    revalidateOnFocus: false,
  });
  return { options: data ?? EMPTY, loading: isLoading, error: error as Error | undefined };
}
