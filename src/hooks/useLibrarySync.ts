"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import type { LibrarySyncJob, SyncablePlatform } from "@/types/library-sync";

const API_URL = "/api/profile/sync-jobs";

interface SyncJobsResponse {
  jobs: LibrarySyncJob[];
}

function hasActiveJob(jobs: LibrarySyncJob[]): boolean {
  return jobs.some((j) => j.status === "pending" || j.status === "running");
}

/**
 * Polls the latest library-sync job per platform and exposes a `startSync`
 * action. While any job is active the query auto-refreshes every 2s so the
 * progress bar advances; polling stops once all jobs settle.
 *
 * Progress lives server-side in `player_library_sync_jobs`, so it survives
 * navigating away and back — this hook simply re-reads it.
 */
export function useLibrarySync() {
  const { data, mutate } = useSWR<SyncJobsResponse>(API_URL, fetcher, {
    refreshInterval: (latest) => (latest && hasActiveJob(latest.jobs) ? 2000 : 0),
  });

  const jobs = data?.jobs ?? [];
  const jobByPlatform = new Map<string, LibrarySyncJob>(jobs.map((j) => [j.platform, j]));

  const startSync = useCallback(
    async (platform: SyncablePlatform): Promise<LibrarySyncJob> => {
      const res = await fetch(`/api/profile/${platform}/sync-library`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `${platform} sync failed`);
      }
      const body = (await res.json()) as { job: LibrarySyncJob };
      await mutate();
      return body.job;
    },
    [mutate]
  );

  return {
    jobByPlatform,
    isAnyActive: hasActiveJob(jobs),
    startSync,
    refresh: mutate,
  };
}
