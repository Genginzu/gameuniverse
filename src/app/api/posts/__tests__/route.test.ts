import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Mutable queue of query results consumed in call order by the builder mock.
let resultsQueue: Array<Record<string, unknown>> = [];

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = chain;
  builder.eq = chain;
  builder.order = chain;
  builder.range = chain;
  builder.in = chain;
  builder.ilike = chain;
  builder.limit = chain;
  // Thenable: each awaited terminal shifts the next queued result.
  builder.then = (resolve: (v: unknown) => unknown) =>
    resolve(resultsQueue.shift() ?? { data: [], error: null, count: 0 });
  return builder;
}

const mockSupabase = { from: vi.fn(() => makeBuilder()) };

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { GET } from "@/app/api/posts/route";

function postRow(id: string, tags: string[] = []) {
  return {
    id,
    player_id: `player-${id}`,
    content: `content ${id}`,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    post_tags: tags.map((tag) => ({ tag })),
    post_mentions: [],
    profiles: { username: `user-${id}`, avatar_url: null },
  };
}

describe("/api/posts", () => {
  beforeEach(() => {
    resultsQueue = [];
    mockSupabase.from.mockClear();
  });

  it("returns the recent posts feed with author info and pagination", async () => {
    resultsQueue = [
      { count: 2, error: null },
      { data: [postRow("1"), postRow("2")], error: null },
    ];

    const request = new NextRequest("http://localhost:3000/api/posts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toHaveLength(2);
    expect(data.posts[0]).toMatchObject({ id: "1", authorName: "user-1" });
    expect(data.pagination.totalCount).toBe(2);
  });

  it("returns an empty feed when there are no posts", async () => {
    resultsQueue = [{ count: 0, error: null }];

    const request = new NextRequest("http://localhost:3000/api/posts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toEqual([]);
    expect(data.pagination.totalCount).toBe(0);
  });

  it("filters by an exact tag", async () => {
    resultsQueue = [
      { count: 1, error: null }, // post_tags count
      { data: [{ post_id: "1" }], error: null }, // post ids
      { data: [postRow("1", ["rpg"])], error: null }, // enriched posts
    ];

    const request = new NextRequest("http://localhost:3000/api/posts?tag=rpg");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toHaveLength(1);
    expect(data.posts[0].tags).toContain("rpg");
  });

  it("performs a wildcard tag search and de-duplicates posts", async () => {
    resultsQueue = [
      { data: [{ post_id: "1" }, { post_id: "1" }, { post_id: "2" }], error: null },
      { data: [postRow("1", ["rpg"]), postRow("2", ["rpgmaker"])], error: null },
    ];

    const request = new NextRequest("http://localhost:3000/api/posts?search=rpg");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toHaveLength(2);
    expect(data.pagination.totalCount).toBe(2);
  });

  it("returns empty for a search shorter than 3 characters", async () => {
    const request = new NextRequest("http://localhost:3000/api/posts?search=rp");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toEqual([]);
  });

  it("rejects an invalid tag format with 400", async () => {
    const request = new NextRequest("http://localhost:3000/api/posts?tag=Invalid Tag!");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid tag format");
  });

  it("returns 500 when the count query errors", async () => {
    resultsQueue = [{ count: null, error: { message: "boom" } }];

    const request = new NextRequest("http://localhost:3000/api/posts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
