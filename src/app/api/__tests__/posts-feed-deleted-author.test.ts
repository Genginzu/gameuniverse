import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const { db } = vi.hoisted(() => ({
  db: { current: null as ReturnType<typeof createSupabaseQueryMock> | null },
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => db.current!.client),
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("@/app/api/posts/route");

beforeEach(() => {
  db.current = createSupabaseQueryMock();
});

describe("GET /api/posts with an anonymised post", () => {
  it("returns the post with a null author instead of failing", async () => {
    db.current!.enqueue(
      "player_posts",
      { count: 1 },
      {
        data: [
          {
            id: "post-1",
            player_id: null,
            content: "Old but gold",
            image_url: null,
            created_at: "2026-10-01T10:00:00Z",
            updated_at: "2026-10-01T10:00:00Z",
            post_tags: [{ tag: "retro" }],
            post_mentions: [],
            profiles: null,
          },
        ],
      }
    );

    const res = await GET(new NextRequest("http://localhost/api/posts"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.posts).toHaveLength(1);
    expect(body.posts[0]).toMatchObject({
      id: "post-1",
      playerId: null,
      authorName: null,
      authorAvatar: null,
      tags: ["retro"],
    });
  });
});
