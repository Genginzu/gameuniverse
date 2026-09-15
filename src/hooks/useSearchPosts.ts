"use client";

import useSWR from "swr";
import type { TagPostsResponse } from "@/types/post";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseSearchPostsResult {
  data: TagPostsResponse | undefined;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches the public posts feed. When `search` is provided (>= 3 chars),
 * returns posts whose tags contain the query substring; otherwise the recent feed.
 */
export function useSearchPosts(search: string, page: number): UseSearchPostsResult {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  query.set("page", String(page));

  const { data, error, isLoading } = useSWR<TagPostsResponse>(
    `/api/posts?${query.toString()}`,
    fetcher
  );

  return { data, isLoading, error: error ? "error" : null };
}
