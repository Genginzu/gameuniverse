"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { GroupService } from "@/lib/services/groupService";
import type { GroupPost } from "@/types/group";

interface GroupPostsResponse {
  posts: GroupPost[];
}

interface UseGroupPostsReturn {
  posts: GroupPost[];
  isLoading: boolean;
  error: string | null;
  isPosting: boolean;
  createPost: (content: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook SWR pour le fil de posts d'un groupe, avec action de publication.
 */
export function useGroupPosts(slug: string): UseGroupPostsReturn {
  const { data, error, isLoading, mutate } = useSWR<GroupPostsResponse>(
    slug ? `/api/groups/${slug}/posts` : null
  );
  const [isPosting, setIsPosting] = useState(false);

  const createPost = useCallback(
    async (content: string) => {
      setIsPosting(true);
      try {
        await GroupService.createPost(slug, { content });
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
