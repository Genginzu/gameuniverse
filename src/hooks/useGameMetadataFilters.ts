"use client";

import useSWR from "swr";

import { fetcher } from "@/lib/swr/fetcher";
import type { GameMetadataFilterOptions } from "@/types/game-metadata";

const EMPTY: GameMetadataFilterOptions = {
  themes: [],
  gameModes: [],
  perspectives: [],
  engines: [],
  franchises: [],
};

/** Options of the games listing metadata filters, plus names of the active engine / franchise slugs. */
export function useGameMetadataFilters(selected: { engines: string[]; franchises: string[] }) {
  const params = new URLSearchParams();
  if (selected.engines.length > 0) params.set("engines", selected.engines.join(","));
  if (selected.franchises.length > 0) params.set("franchises", selected.franchises.join(","));
  const query = params.toString();

  const { data, isLoading } = useSWR<GameMetadataFilterOptions>(
    `/api/game-metadata${query ? `?${query}` : ""}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );
  return { options: data ?? EMPTY, loading: isLoading };
}
