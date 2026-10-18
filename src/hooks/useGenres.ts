"use client";

import useSWR from "swr";

import { fetcher } from "@/lib/swr/fetcher";
import type { Genre } from "@/types/genre";

export function useGenres(locale: string) {
  const { data, isLoading } = useSWR<{ genres: Genre[] }>(`/api/genres?locale=${locale}`, fetcher, {
    revalidateOnFocus: false,
  });
  return { genres: data?.genres ?? [], loading: isLoading };
}
