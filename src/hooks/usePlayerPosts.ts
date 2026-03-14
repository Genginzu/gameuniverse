"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Post } from "@/types/post";
import { PlayerPostsService } from "@/lib/services/playerPostsService";

export function usePlayerPosts(playerId: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  // Debounce searchTerm by 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPosts = useCallback(
    async (page: number, append: boolean, search?: string) => {
      if (!playerId || isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        append ? setIsLoadingMore(true) : setIsLoading(true);
        setError(null);

        const response = await PlayerPostsService.fetchPosts(playerId, page, search || undefined);

        setPosts((prev) => (append ? [...prev, ...response.posts] : response.posts));
        setHasNextPage(response.pagination.hasNextPage);
        pageRef.current = page;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch posts";
        setError(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [playerId]
  );

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingRef.current) return;
    fetchPosts(pageRef.current + 1, true, debouncedSearch);
  }, [hasNextPage, fetchPosts, debouncedSearch]);

  const createPost = useCallback(
    async (content: string, imageUrl?: string) => {
      setIsCreating(true);
      try {
        const newPost = await PlayerPostsService.createPost(playerId, content, imageUrl);
        setPosts((prev) => [newPost, ...prev]);
      } finally {
        setIsCreating(false);
      }
    },
    [playerId]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      await PlayerPostsService.deletePost(playerId, postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    },
    [playerId]
  );

  // Re-fetch from page 1 when debouncedSearch or playerId changes
  useEffect(() => {
    pageRef.current = 1;
    fetchPosts(1, false, debouncedSearch);
  }, [fetchPosts, debouncedSearch]);

  return {
    posts,
    isLoading,
    isLoadingMore,
    isCreating,
    hasNextPage,
    error,
    searchTerm,
    setSearchTerm,
    loadMore,
    createPost,
    deletePost,
  };
}
