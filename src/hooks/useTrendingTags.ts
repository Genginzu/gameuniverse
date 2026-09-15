"use client";

import useSWR from "swr";
import type { TrendingTag, TrendingTagsResponse } from "@/types/post";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseTrendingTagsResult {
  tags: TrendingTag[];
  isLoading: boolean;
  error: string | null;
}

/** Fetches the trending post tags (most used across the community). */
export function useTrendingTags(limit = 10): UseTrendingTagsResult {
  const { data, error, isLoading } = useSWR<TrendingTagsResponse>(
    `/api/posts/tags?limit=${limit}`,
    fetcher
  );

  return {
    tags: data?.tags ?? [],
    isLoading,
    error: error ? "error" : null,
  };
}
