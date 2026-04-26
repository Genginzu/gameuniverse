import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const { mockGetPost, mockDeletePost } = vi.hoisted(() => ({
  mockGetPost: vi.fn(),
  mockDeletePost: vi.fn(),
}));
vi.mock("@/lib/services/playerPostsServerService", () => ({
  PlayerPostsServerService: { getPost: mockGetPost, deletePost: mockDeletePost },
}));

const { mockGetUser } = vi.hoisted(() => ({ mockGetUser: vi.fn() }));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser }, from: vi.fn() })),
}));

import { DELETE } from "@/app/api/players/[id]/posts/[postId]/route";

const params = { params: Promise.resolve({ id: "user1", postId: "p1" }) };

describe("DELETE /api/players/[id]/posts/[postId]", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no auth" } });
    const req = new NextRequest("http://localhost/api/players/user1/posts/p1", {
      method: "DELETE",
    });
    const res = await DELETE(req, params);
    expect(res.status).toBe(401);
  });

  test("returns 403 when not owner", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "other-user" } }, error: null });
    mockGetPost.mockResolvedValue({ id: "p1", playerId: "user1" });
    const req = new NextRequest("http://localhost/api/players/user1/posts/p1", {
      method: "DELETE",
    });
    const res = await DELETE(req, params);
    expect(res.status).toBe(403);
  });

  test("returns 204 on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    mockGetPost.mockResolvedValue({ id: "p1", playerId: "user1" });
    mockDeletePost.mockResolvedValue(undefined);
    const req = new NextRequest("http://localhost/api/players/user1/posts/p1", {
      method: "DELETE",
    });
    const res = await DELETE(req, params);
    expect(res.status).toBe(204);
  });
});
