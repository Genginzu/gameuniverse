import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

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

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser }, from: vi.fn() })),
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
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no auth" } });
    const req = new NextRequest("http://localhost/api/posts/p1/comments", {
      method: "POST",
      body: JSON.stringify({ content: "hello" }),
    });
    const res = await POST(req, postParams);
    expect(res.status).toBe(401);
  });

  test("returns 404 when post not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(PlayerPostsServerService.getPost).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/posts/p1/comments", {
      method: "POST",
      body: JSON.stringify({ content: "hello" }),
    });
    const res = await POST(req, postParams);
    expect(res.status).toBe(404);
  });

  test("returns 400 when content is invalid", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
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
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
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
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no auth" } });
    const req = new NextRequest("http://localhost/api/posts/p1/comments/c1", { method: "DELETE" });
    const res = await DELETE(req, commentParams);
    expect(res.status).toBe(401);
  });

  test("returns 404 when post not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(PlayerPostsServerService.getPost).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/posts/p1/comments/c1", { method: "DELETE" });
    const res = await DELETE(req, commentParams);
    expect(res.status).toBe(404);
  });

  test("returns 403 when not authorized", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(PlayerPostsServerService.getPost).mockResolvedValue({ id: "p1", playerId: "owner1" });
    vi.mocked(PostCommentServerService.deleteComment).mockRejectedValue(new Error("Forbidden"));
    const req = new NextRequest("http://localhost/api/posts/p1/comments/c1", { method: "DELETE" });
    const res = await DELETE(req, commentParams);
    expect(res.status).toBe(403);
  });

  test("returns 204 when successful", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(PlayerPostsServerService.getPost).mockResolvedValue({ id: "p1", playerId: "owner1" });
    vi.mocked(PostCommentServerService.deleteComment).mockResolvedValue(undefined);
    const req = new NextRequest("http://localhost/api/posts/p1/comments/c1", { method: "DELETE" });
    const res = await DELETE(req, commentParams);
    expect(res.status).toBe(204);
  });
});
