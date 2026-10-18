"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import type { MyReport, MyReportsResponse, ReportContentType } from "@/types/report";

export const MY_REPORTS_KEY = "/api/reports";

/**
 * Current user's reports, shared by every ReportButton on the page.
 * SWR dedupes the key so the list is fetched once; guests get a 401 and an empty list.
 */
export function useMyReports() {
  const { data, mutate, isLoading } = useSWR<MyReportsResponse>(MY_REPORTS_KEY, fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });

  const findReport = useCallback(
    (contentType: ReportContentType, contentId: string): MyReport | undefined =>
      data?.reports.find((r) => r.contentType === contentType && r.contentId === contentId),
    [data]
  );

  return { findReport, mutate, isLoading };
}
