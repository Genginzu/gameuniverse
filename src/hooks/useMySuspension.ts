"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { MY_SUSPENSION_KEY } from "@/lib/services/apiError";
import type { MySuspensionResponse } from "@/types/report";

/**
 * Signed-in user's suspension status, shared by every SuspensionGate (SWR dedupes).
 * Guests get a 401 and are treated as not suspended.
 */
export function useMySuspension(enabled = true) {
  const { data, isLoading } = useSWR<MySuspensionResponse>(
    enabled ? MY_SUSPENSION_KEY : null,
    fetcher,
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  const until = data?.until ?? null;
  // A suspension may end while the page stays open: honour the end date client-side.
  const stillRunning = !until || new Date(until).getTime() > Date.now();

  return {
    suspended: (data?.suspended ?? false) && stillRunning,
    until,
    isLoading,
  };
}
