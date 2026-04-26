"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import type {
  EsportTeam,
  EsportPlayerWithTeam,
  EsportTournament,
  EsportMatchWithDetails,
} from "@/types/esport";

interface ListResponse<T> {
  total: number;
  page: number;
  totalPages: number;
  teams?: T[];
  players?: T[];
  tournaments?: T[];
  matches?: T[];
}

function useAdminEsportList<T>(
  entity: string,
  page: number,
  limit: number,
  search: string,
  extra?: Record<string, string>
) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  if (extra) Object.entries(extra).forEach(([k, v]) => v && params.set(k, v));

  const key = `/api/admin/esport/${entity}?${params}`;
  const { data, error, isLoading, mutate } = useSWR<ListResponse<T>>(key);

  const items = (data?.[entity as keyof ListResponse<T>] ?? []) as T[];

  const remove = useCallback(
    async (id: string) => {
      await apiClient.delete(`/api/admin/esport/${entity}/${id}`);
      mutate();
    },
    [entity, mutate]
  );

  return {
    items,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    error,
    mutate,
    remove,
  };
}

export function useAdminEsportTeams(page: number, limit: number, search: string) {
  return useAdminEsportList<EsportTeam>("teams", page, limit, search);
}

export function useAdminEsportPlayers(page: number, limit: number, search: string) {
  return useAdminEsportList<EsportPlayerWithTeam>("players", page, limit, search);
}

export function useAdminEsportTournaments(page: number, limit: number, search: string) {
  return useAdminEsportList<EsportTournament>("tournaments", page, limit, search);
}

export function useAdminEsportMatches(
  page: number,
  limit: number,
  search: string,
  tournamentId?: string
) {
  return useAdminEsportList<EsportMatchWithDetails>(
    "matches",
    page,
    limit,
    search,
    tournamentId ? { tournament_id: tournamentId } : undefined
  );
}
