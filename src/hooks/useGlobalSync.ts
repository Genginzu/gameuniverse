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
  currentOffset: number;
  totalInserted: number;
  error: string | null;
}

export function useGlobalSync(page: number, search: string, filter: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: "50",
    search,
    filter,
  });

  const { data, error, isLoading, mutate } = useSWR<GlobalSyncResponse>(
    `/api/admin/global-sync?${params}`,
    fetcher
  );

  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    currentOffset: 0,
    totalInserted: 0,
    error: null,
  });

  const startDownload = useCallback(async () => {
    setDownloadState({ isDownloading: true, currentOffset: 0, totalInserted: 0, error: null });

    let offset = 0;
    let totalInserted = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const result = await apiClient.post<{
          inserted: number;
          hasMore: boolean;
          nextOffset: number;
        }>("/api/admin/global-sync/download", { offset });

        totalInserted += result.inserted;
        hasMore = result.hasMore;
        offset = result.nextOffset;

        setDownloadState((prev) => ({
          ...prev,
          currentOffset: offset,
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
