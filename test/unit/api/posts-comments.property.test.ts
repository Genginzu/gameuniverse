import { describe, test, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { NextRequest } from "next/server";

// --- Mocks ---

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/services/postCommentServerService", () => ({
  PostCommentServerService: {
    getComments: vi.fn(),
    createComment: vi.fn(),
    deleteComment: vi.fn(),
  },
}));

vi.mock("@/lib/services/playerPostsServerService", () => ({
  PlayerPostsServerService: {
    getPost: vi.fn(),
  },
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

// --- Imports (after mocks) ---

import { GET } from "@/app/api/posts/[postId]/comments/route";
import { DELETE } from "@/app/api/posts/[postId]/comments/[commentId]/route";
import { PostCommentServerService } from "@/lib/services/postCommentServerService";
import { PlayerPostsServerService } from "@/lib/services/playerPostsServerService";
import type { PostComment } from "@/types/post-comment";

// --- Helpers ---

const AUTHENTICATED_USER = { id: "user-auth-001" };

function authenticateUser(userId: string = AUTHENTICATED_USER.id) {
  mockGetUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
}

function makeComment(overrides: Partial<PostComment> = {}): PostComment {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    postId: overrides.postId ?? "post-001",
    playerId: overrides.playerId ?? crypto.randomUUID(),
    content: overrides.content ?? "A comment",
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    player: overrides.player ?? { username: "player", avatarUrl: null },
  };
}

// --- Property 2: Tri des commentaires par date croissante ---
// **Validates: Requirements 1.4**

describe("Feature: notifications-system, Property 2: Tri des commentaires par date croissante", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("GET /api/posts/[postId]/comments returns comments sorted by createdAt ASC with player info", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") }), {
          minLength: 1,
          maxLength: 30,
        }),
        async (postId, dates) => {
          // Build comments sorted by date ASC (as the service would return)
          const comments = dates
            .map((d) =>
              makeComment({
                postId,
                createdAt: d.toISOString(),
                updatedAt: d.toISOString(),
                player: {
                  username: `user-${Math.random().toString(36).slice(2, 8)}`,
                  avatarUrl: Math.random() > 0.5 ? "https://example.com/avatar.png" : null,
                },
              })
            )
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          vi.mocked(PostCommentServerService.getComments).mockResolvedValue({
            comments,
            totalCount: comments.length,
          });

          const req = new NextRequest(`http://localhost/api/posts/${postId}/comments`);
          const res = await GET(req, {
            params: Promise.resolve({ postId }),
          });
          const body = await res.json();

          // Verify sorted by createdAt ASC
          for (let i = 1; i < body.comments.length; i++) {
            const prev = new Date(body.comments[i - 1].createdAt).getTime();
            const curr = new Date(body.comments[i].createdAt).getTime();
            expect(prev).toBeLessThanOrEqual(curr);
          }

          // Verify each comment has player info
          for (const comment of body.comments) {
            expect(comment.player).toBeDefined();
            expect(typeof comment.player.username).toBe("string");
            expect(comment.player.username.length).toBeGreaterThan(0);
          }

          // Verify totalCount matches
          expect(body.totalCount).toBe(comments.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- Property 3: Autorisation de suppression de commentaire ---
// **Validates: Requirements 1.6, 1.8**

describe("Feature: notifications-system, Property 3: Autorisation de suppression de commentaire", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("DELETE succeeds when user is comment author, post owner, or returns 403 otherwise", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // postId
        fc.uuid(), // commentId
        fc.uuid(), // commentOwnerId
        fc.uuid(), // postOwnerId
        fc.constantFrom("comment-author", "post-owner", "neither") as fc.Arbitrary<
          "comment-author" | "post-owner" | "neither"
        >,
        async (postId, commentId, commentOwnerId, postOwnerId, role) => {
          // Determine the authenticated user based on the role
          let userId: string;
          if (role === "comment-author") {
            userId = commentOwnerId;
          } else if (role === "post-owner") {
            userId = postOwnerId;
          } else {
            // Generate a user that is neither comment author nor post owner
            userId = crypto.randomUUID();
          }

          authenticateUser(userId);

          // Mock getPost to return the post with its owner
          vi.mocked(PlayerPostsServerService.getPost).mockResolvedValue({
            id: postId,
            playerId: postOwnerId,
          });

          if (role === "comment-author" || role === "post-owner") {
            // deleteComment succeeds (no error thrown)
            vi.mocked(PostCommentServerService.deleteComment).mockResolvedValue(undefined);
          } else {
            // deleteComment throws "Forbidden"
            vi.mocked(PostCommentServerService.deleteComment).mockRejectedValue(
              new Error("Forbidden")
            );
          }

          const req = new NextRequest(
            `http://localhost/api/posts/${postId}/comments/${commentId}`,
            { method: "DELETE" }
          );
          const res = await DELETE(req, {
            params: Promise.resolve({ postId, commentId }),
          });

          if (role === "comment-author" || role === "post-owner") {
            expect(res.status).toBe(204);
          } else {
            expect(res.status).toBe(403);
            const body = await res.json();
            expect(body.error).toBe("Forbidden");
          }

          // Verify deleteComment was called with correct arguments
          expect(PostCommentServerService.deleteComment).toHaveBeenCalledWith(
            commentId,
            userId,
            postOwnerId
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
