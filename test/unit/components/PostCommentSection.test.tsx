import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import type { PostComment } from "@/types/post-comment";

// Mock usePostComments hook
const mockHookReturn = {
  comments: [] as PostComment[],
  totalCount: 0,
  isLoading: false,
  error: null,
  isSubmitting: false,
  addComment: vi.fn().mockResolvedValue(true),
  deleteComment: vi.fn().mockResolvedValue(true),
};
const mockUsePostComments = vi.fn(() => mockHookReturn);

vi.mock("@/hooks/usePostComments", () => ({
  usePostComments: (...args: unknown[]) => mockUsePostComments(...args),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === "title") return "Comments";
    if (key === "noComments") return "No comments";
    if (key === "charCount") return `${params?.remaining} chars left`;
    if (key === "placeholder") return "Write a comment...";
    if (key === "submit") return "Submit";
    if (key === "deleteLabel") return "Delete";
    return key;
  },
  useFormatter: () => ({ relativeTime: () => "just now" }),
}));

import { PostCommentSection } from "@/components/players/posts/PostCommentSection";

const SAMPLE_COMMENT: PostComment = {
  id: "comment-1",
  postId: "post-1",
  playerId: "player-2",
  content: "Great post!",
  createdAt: "2024-03-10T12:00:00Z",
  updatedAt: "2024-03-10T12:00:00Z",
  player: { username: "TestUser", avatarUrl: null },
};

describe("PostCommentSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePostComments.mockReturnValue({ ...mockHookReturn });
  });

  // Req 1.11 — renders comment count correctly
  it("renders comment count correctly", () => {
    mockUsePostComments.mockReturnValue({ ...mockHookReturn, totalCount: 5 });
    render(<PostCommentSection postId="post-1" isPostOwner={false} isAuthenticated={false} />);
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading.textContent).toContain("(5)");
  });

  // Req 1.11 — shows "no comments" when empty
  it("shows 'no comments' when empty", () => {
    mockUsePostComments.mockReturnValue({
      ...mockHookReturn,
      comments: [],
      totalCount: 0,
    });
    render(<PostCommentSection postId="post-1" isPostOwner={false} isAuthenticated={false} />);
    expect(screen.getByText("No comments")).toBeInTheDocument();
  });

  // Req 1.10 — renders comments when present
  it("renders comments when present", () => {
    mockUsePostComments.mockReturnValue({
      ...mockHookReturn,
      comments: [SAMPLE_COMMENT],
      totalCount: 1,
    });
    render(
      <PostCommentSection
        postId="post-1"
        isPostOwner={false}
        isAuthenticated={false}
        currentPlayerId="player-3"
      />
    );
    expect(screen.getByText("Great post!")).toBeInTheDocument();
    expect(screen.getByText("TestUser")).toBeInTheDocument();
  });

  // Req 1.10 — shows form when authenticated
  it("shows form when authenticated", () => {
    render(
      <PostCommentSection
        postId="post-1"
        isPostOwner={false}
        isAuthenticated={true}
        currentPlayerId="player-1"
      />
    );
    expect(screen.getByPlaceholderText("Write a comment...")).toBeInTheDocument();
  });

  // Req 1.10 — hides form when not authenticated
  it("hides form when not authenticated", () => {
    render(<PostCommentSection postId="post-1" isPostOwner={false} isAuthenticated={false} />);
    expect(screen.queryByPlaceholderText("Write a comment...")).not.toBeInTheDocument();
  });

  // Loading state
  it("shows loading state", () => {
    mockUsePostComments.mockReturnValue({
      ...mockHookReturn,
      isLoading: true,
    });
    render(<PostCommentSection postId="post-1" isPostOwner={false} isAuthenticated={false} />);
    // No comments or "no comments" message should be shown during loading
    expect(screen.queryByText("No comments")).not.toBeInTheDocument();
    expect(screen.queryByText("Great post!")).not.toBeInTheDocument();
  });
});
