import { useState, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";

export interface DownloadState {
  isDownloading: boolean;
  lastId: number;
  totalInserted: number;
  error: string | null;
}

export function useGlobalDownload(onComplete?: () => void) {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    lastId: 0,
    totalInserted: 0,
    error: null,
  });

  const stopRef = useRef(false);

  const startDownload = useCallback(async () => {
    stopRef.current = false;
    setDownloadState({ isDownloading: true, lastId: 0, totalInserted: 0, error: null });

    let afterId = 0;
    let totalInserted = 0;
    let hasMore = true;

    while (hasMore && !stopRef.current) {
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
    onComplete?.();
  }, [onComplete]);

  const stopDownload = useCallback(() => {
    stopRef.current = true;
  }, []);

  return { downloadState, startDownload, stopDownload };
}
