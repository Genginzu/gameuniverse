import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

const routeEnv = useTestRouteEnvironment({ signedInAs: testUser("user", { id: "u1" }) });

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/services/postCommentServerService", () => ({
  PostCommentServerService: {
    getComments: vi.fn(async () => ({ comments: [], totalCount: 0 })),
    createComment: vi.fn(async () => ({
      id: "c1",
      postId: "p1",
      playerId: "u1",
      content: "hello",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    })),
    deleteComment: vi.fn(async () => undefined),
  },
}));

vi.mock("@/lib/services/playerPostsServerService", () => ({
  PlayerPostsServerService: {
    getPost: vi.fn(async () => ({ id: "p1", playerId: "owner1" })),
  },
}));

import { GET, POST } from "@/app/api/posts/[postId]/comments/route";
import { DELETE } from "@/app/api/posts/[postId]/comments/[commentId]/route";
import { PostCommentServerService } from "@/lib/services/postCommentServerService";
import { PlayerPostsServerService } from "@/lib/services/playerPostsServerService";

const postParams = { params: Promise.resolve({ postId: "p1" }) };
const commentParams = { params: Promise.resolve({ postId: "p1", commentId: "c1" }) };

describe("GET /api/posts/[postId]/comments", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 200 with comments", async () => {
    const mockData = { comments: [{ id: "c1", content: "hi" }], totalCount: 1 };
    vi.mocked(PostCommentServerService.getComments).mockResolvedValue(mockData as any);
    const req = new NextRequest("http://localhost/api/posts/p1/comments");
    const res = await GET(req, postParams);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockData);
  });
});

describe("POST /api/posts/[postId]/comments", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when not authenticated", async () => {
    routeEnv.signOut();
    const req = new NextRequest("http://localhost/api/posts/p1/comments", {
      method: "POST",
      body: JSON.stringify({ content: "hello" }),
    });
    const res = await POST(req, postParams);
    expect(res.status).toBe(401);
  });

  test("returns 404 when post not found", async () => {
    vi.mocked(PlayerPostsServerService.getPost).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/posts/p1/comments", {
      method: "POST",
      body: JSON.stringify({ content: "hello" }),
    });
    const res = await POST(req, postParams);
    expect(res.status).toBe(404);
  });

  test("returns 400 when content is invalid", async () => {
    vi.mocked(PlayerPostsServerService.getPost).mockResolvedValue({ id: "p1", playerId: "owner1" });
    vi.mocked(PostCommentServerService.createComment).mockRejectedValue(
      new Error("Content must be between 1 and 500 characters")
    );
    const req = new NextRequest("http://localhost/api/posts/p1/comments", {
      method: "POST",
      body: JSON.stringify({ content: "" }),
    });
    const res = await POST(req, postParams);
    expect(res.status).toBe(400);
  });

  test("returns 201 when successful", async () => {
    vi.mocked(PlayerPostsServerService.getPost).mockResolvedValue({ id: "p1", playerId: "owner1" });
    const mockComment = {
      id: "c1",
      postId: "p1",
      playerId: "u1",
      content: "hello",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };
    vi.mocked(PostCommentServerService.createComment).mockResolvedValue(mockComment as any);
    const req = new NextRequest("http://localhost/api/posts/p1/comments", {
      method: "POST",
      body: JSON.stringify({ content: "hello" }),
    });
    const res = await POST(req, postParams);
    expect(res.status).toBe(201);
    expect((await res.json()).id).toBe("c1");
  });
});

describe("DELETE /api/posts/[postId]/comments/[commentId]", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when not authenticated", async () => {
    routeEnv.signOut();
    const req = new NextRequest("http://localhost/api/posts/p1/comments/c1", { method: "DELETE" });
    const res = await DELETE(req, commentParams);
    expect(res.status).toBe(401);
  });

  test("returns 404 when post not found", async () => {
    vi.mocked(PlayerPostsServerService.getPost).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/posts/p1/comments/c1", { method: "DELETE" });
    const res = await DELETE(req, commentParams);
    expect(res.status).toBe(404);
  });

  test("returns 403 when not authorized", async () => {
    vi.mocked(PlayerPostsServerService.getPost).mockResolvedValue({ id: "p1", playerId: "owner1" });
    vi.mocked(PostCommentServerService.deleteComment).mockRejectedValue(new Error("Forbidden"));
    const req = new NextRequest("http://localhost/api/posts/p1/comments/c1", { method: "DELETE" });
    const res = await DELETE(req, commentParams);
    expect(res.status).toBe(403);
  });

  test("returns 204 when successful", async () => {
    vi.mocked(PlayerPostsServerService.getPost).mockResolvedValue({ id: "p1", playerId: "owner1" });
    vi.mocked(PostCommentServerService.deleteComment).mockResolvedValue(undefined);
    const req = new NextRequest("http://localhost/api/posts/p1/comments/c1", { method: "DELETE" });
    const res = await DELETE(req, commentParams);
    expect(res.status).toBe(204);
  });
});

describe("POST /api/posts/[postId]/comments refusals", () => {
  beforeEach(() => vi.clearAllMocks());

  function commentRequest() {
    return new NextRequest("http://localhost/api/posts/p1/comments", {
      method: "POST",
      body: JSON.stringify({ content: "hello" }),
    });
  }

  test("returns the standard 401 body when signed out", async () => {
    routeEnv.signOut();
    const res = await POST(commentRequest(), postParams);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  test("returns 403 suspended for a suspended account", async () => {
    routeEnv.suspend("2030-01-01T00:00:00Z");
    const res = await POST(commentRequest(), postParams);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "suspended" });
    expect(PostCommentServerService.createComment).not.toHaveBeenCalled();
  });

  test("returns 429 when the comment rate limit is exceeded", async () => {
    routeEnv.exceedRateLimit(60);
    const res = await POST(commentRequest(), postParams);
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ code: "rate_limited", retryAfter: 60 });
    expect(routeEnv.rateLimitHits).toEqual(["comment:user:u1"]);
  });
});
