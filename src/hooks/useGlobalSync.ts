import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";

interface GlobalSyncEntry {
  id: number;
  igdb_id: number;
  name: string;
  cover_image_id: string | null;
  matched_game_id: string | null;
  created_at: string;
}

interface GlobalSyncResponse {
  entries: GlobalSyncEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export function useGlobalSync(page: number, search: string, filter: string) {
  const swrKey = `/api/admin/global-sync?page=${page}&limit=100&search=${encodeURIComponent(search)}&filter=${filter}`;

  const { data, error, isLoading, mutate } = useSWR<GlobalSyncResponse>(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5000,
  });

  return {
    entries: data?.entries ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    error: error?.message ?? null,
    refresh: mutate,
  };
}
