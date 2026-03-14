import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PlayerPostsService } from "@/lib/services/playerPostsService";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const POST_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

const mockPost = {
  id: POST_ID,
  playerId: PLAYER_ID,
  content: "Hello world",
  createdAt: "2024-03-10T12:00:00Z",
  updatedAt: "2024-03-10T12:00:00Z",
};

const mockPostsResponse = {
  posts: [mockPost],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 1,
    hasNextPage: false,
  },
};

describe("PlayerPostsService", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("fetchPosts", () => {
    it("should return PostsResponse successfully", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPostsResponse),
      });

      const result = await PlayerPostsService.fetchPosts(PLAYER_ID);

      expect(result).toEqual(mockPostsResponse);
      expect(globalThis.fetch).toHaveBeenCalledOnce();
    });

    it("should construct URL without page param when not provided", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPostsResponse),
      });

      await PlayerPostsService.fetchPosts(PLAYER_ID);

      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toBe(`/api/players/${PLAYER_ID}/posts`);
      expect(url).not.toContain("?");
    });

    it("should construct URL with page param when provided", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPostsResponse),
      });

      await PlayerPostsService.fetchPosts(PLAYER_ID, 2);

      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toBe(`/api/players/${PLAYER_ID}/posts?page=2`);
    });
  });

  describe("createPost", () => {
    it("should return Post successfully", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPost),
      });

      const result = await PlayerPostsService.createPost(PLAYER_ID, "Hello world");

      expect(result).toEqual(mockPost);
      expect(globalThis.fetch).toHaveBeenCalledWith(`/api/players/${PLAYER_ID}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Hello world" }),
      });
    });
  });

  describe("deletePost", () => {
    it("should succeed with correct DELETE request", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
      });

      await PlayerPostsService.deletePost(PLAYER_ID, POST_ID);

      expect(globalThis.fetch).toHaveBeenCalledWith(`/api/players/${PLAYER_ID}/posts/${POST_ID}`, {
        method: "DELETE",
      });
    });
  });

  describe("error propagation", () => {
    it("should throw with error message from response body", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Player not found" }),
      });

      await expect(PlayerPostsService.fetchPosts(PLAYER_ID)).rejects.toThrow("Player not found");
    });

    it("should throw with status code fallback when body parse fails", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("not json")),
      });

      await expect(PlayerPostsService.fetchPosts(PLAYER_ID)).rejects.toThrow(
        "Failed to fetch posts (500)"
      );
    });

    it("should propagate error from createPost", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Content is required" }),
      });

      await expect(PlayerPostsService.createPost(PLAYER_ID, "")).rejects.toThrow(
        "Content is required"
      );
    });

    it("should propagate error from deletePost", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: "Forbidden" }),
      });

      await expect(PlayerPostsService.deletePost(PLAYER_ID, POST_ID)).rejects.toThrow("Forbidden");
    });
  });
});
