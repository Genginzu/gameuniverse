import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { SWRConfig } from "swr";
import React from "react";

vi.mock("@/lib/services/postCommentService", () => ({
  PostCommentService: {
    fetchComments: vi.fn(),
    createComment: vi.fn(),
    deleteComment: vi.fn(),
  },
}));

import { usePostComments } from "@/hooks/usePostComments";
import { PostCommentService } from "@/lib/services/postCommentService";

const mockedFetchComments = PostCommentService.fetchComments as ReturnType<typeof vi.fn>;
const mockedCreateComment = PostCommentService.createComment as ReturnType<typeof vi.fn>;
const mockedDeleteComment = PostCommentService.deleteComment as ReturnType<typeof vi.fn>;

/** Wrapper that disables SWR cache between tests */
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    children
  );

const MOCK_COMMENTS = {
  comments: [
    {
      id: "c1",
      postId: "post-1",
      playerId: "u2",
      content: "Nice post!",
      createdAt: "2024-06-01T10:00:00Z",
      updatedAt: "2024-06-01T10:00:00Z",
      player: { username: "Bob", avatarUrl: null },
    },
  ],
  totalCount: 1,
};

describe("usePostComments", () => {
  beforeEach(() => {
    mockedFetchComments.mockReset();
    mockedCreateComment.mockReset();
    mockedDeleteComment.mockReset();
    mockedFetchComments.mockResolvedValue(MOCK_COMMENTS);
    mockedCreateComment.mockResolvedValue({ id: "c2", content: "New comment" });
    mockedDeleteComment.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns loading state initially", () => {
    const { result } = renderHook(() => usePostComments("post-1"), { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.comments).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it("fetches comments for the given post", async () => {
    const { result } = renderHook(() => usePostComments("post-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedFetchComments).toHaveBeenCalledWith("post-1");
    expect(result.current.comments).toEqual(MOCK_COMMENTS.comments);
    expect(result.current.totalCount).toBe(1);
  });

  it("does not fetch when postId is empty", async () => {
    const { result } = renderHook(() => usePostComments(""), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedFetchComments).not.toHaveBeenCalled();
    expect(result.current.comments).toEqual([]);
  });

  it("addComment calls the service and revalidates", async () => {
    const { result } = renderHook(() => usePostComments("post-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean = false;
    await act(async () => {
      success = await result.current.addComment("New comment");
    });

    expect(success).toBe(true);
    expect(mockedCreateComment).toHaveBeenCalledWith("post-1", "New comment");
  });

  it("addComment returns false on failure", async () => {
    mockedCreateComment.mockRejectedValue(new Error("Failed"));

    const { result } = renderHook(() => usePostComments("post-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean = true;
    await act(async () => {
      success = await result.current.addComment("Bad comment");
    });

    expect(success).toBe(false);
  });

  it("deleteComment calls the service and revalidates", async () => {
    const { result } = renderHook(() => usePostComments("post-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean = false;
    await act(async () => {
      success = await result.current.deleteComment("c1");
    });

    expect(success).toBe(true);
    expect(mockedDeleteComment).toHaveBeenCalledWith("post-1", "c1");
  });

  it("deleteComment returns false on failure", async () => {
    mockedDeleteComment.mockRejectedValue(new Error("Forbidden"));

    const { result } = renderHook(() => usePostComments("post-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean = true;
    await act(async () => {
      success = await result.current.deleteComment("c1");
    });

    expect(success).toBe(false);
  });

  it("sets error state on fetch failure", async () => {
    mockedFetchComments.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePostComments("post-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe("Network error");
    });
  });
});
