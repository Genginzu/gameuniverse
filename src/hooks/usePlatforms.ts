"use client";

import useSWR from "swr";

import { fetcher } from "@/lib/swr/fetcher";
import type { PlatformFilterOption } from "@/types/platform";

export function usePlatforms(locale: string) {
  const { data, isLoading } = useSWR<{ platforms: PlatformFilterOption[] }>(
    `/api/platforms?locale=${locale}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { platforms: data?.platforms ?? [], loading: isLoading };
}
