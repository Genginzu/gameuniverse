import { useState, useCallback } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { apiClient } from "@/lib/api-client";

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

interface DownloadState {
  isDownloading: boolean;
  lastId: number;
  totalInserted: number;
  error: string | null;
}

export function useGlobalSync(page: number, search: string, filter: string) {
  const swrKey = `/api/admin/global-sync?page=${page}&limit=100&search=${encodeURIComponent(search)}&filter=${filter}`;

  const { data, error, isLoading, mutate } = useSWR<GlobalSyncResponse>(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5000,
  });

  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    lastId: 0,
    totalInserted: 0,
    error: null,
  });

  const startDownload = useCallback(async () => {
    setDownloadState({ isDownloading: true, lastId: 0, totalInserted: 0, error: null });

    let afterId = 0;
    let totalInserted = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const result = await apiClient.post<{
          inserted: number;
          hasMore: boolean;
          lastId: number;
        }>("/api/admin/global-sync/download", { afterId });

        totalInserted += result.inserted;
        hasMore = result.hasMore;
        afterId = result.lastId;

        setDownloadState((prev) => ({
          ...prev,
          lastId: afterId,
          totalInserted,
        }));
      } catch (err) {
        setDownloadState((prev) => ({
          ...prev,
          isDownloading: false,
          error: err instanceof Error ? err.message : "Download failed",
        }));
        return;
      }
    }

    setDownloadState((prev) => ({ ...prev, isDownloading: false }));
    mutate();
  }, [mutate]);

  return {
    entries: data?.entries ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    error: error?.message ?? null,
    downloadState,
    startDownload,
    refresh: mutate,
  };
}
