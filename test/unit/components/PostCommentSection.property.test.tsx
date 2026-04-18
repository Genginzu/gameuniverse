import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import React from "react";
import { render, screen } from "@testing-library/react";

// Feature: notifications-system, Property 12: Compteur de commentaires affiché
// **Validates: Requirements 1.11**

// Mock usePostComments hook
const mockHookReturn = {
  comments: [],
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

describe("PostCommentSection Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePostComments.mockReturnValue({ ...mockHookReturn });
  });

  // Feature: notifications-system, Property 12: Compteur de commentaires affiché
  // **Validates: Requirements 1.11**
  describe("Property 12: Compteur de commentaires affiché", () => {
    it("displayed count matches exactly the totalCount for any number of comments (0-50)", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 50 }), (totalCount) => {
          mockUsePostComments.mockReturnValue({
            ...mockHookReturn,
            totalCount,
          });

          const { unmount } = render(
            <PostCommentSection
              postId="post-1"
              isPostOwner={false}
              isAuthenticated={false}
              currentPlayerId={undefined}
            />
          );

          // The component renders: "Comments ({totalCount})"
          const heading = screen.getByRole("heading", { level: 3 });
          expect(heading.textContent).toContain(`(${totalCount})`);

          unmount();
        }),
        { numRuns: 100 }
      );
    });
  });
});
