"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { CommunityService } from "@/lib/services/communityService";
import type { CommunityPost } from "@/types/community";

interface CommunityPostsResponse {
  posts: CommunityPost[];
}

interface UseCommunityPostsReturn {
  posts: CommunityPost[];
  isLoading: boolean;
  error: string | null;
  isPosting: boolean;
  createPost: (content: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook SWR pour le fil de posts d'une communauté, avec action de publication.
 */
export function useCommunityPosts(slug: string): UseCommunityPostsReturn {
  const { data, error, isLoading, mutate } = useSWR<CommunityPostsResponse>(
    slug ? `/api/communities/${slug}/posts` : null
  );
  const [isPosting, setIsPosting] = useState(false);

  const createPost = useCallback(
    async (content: string) => {
      setIsPosting(true);
      try {
        await CommunityService.createPost(slug, { content });
        await mutate();
      } finally {
        setIsPosting(false);
      }
    },
    [slug, mutate]
  );

  return {
    posts: data?.posts ?? [],
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch posts") : null,
    isPosting,
    createPost,
    refetch: async () => {
      await mutate();
    },
  };
}
