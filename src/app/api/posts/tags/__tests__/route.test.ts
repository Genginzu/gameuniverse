import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const mockRpc = vi.fn(() => Promise.resolve({ data: null, error: null }));

const mockSupabase = {
  rpc: mockRpc,
};

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { GET } from "@/app/api/posts/tags/route";

describe("/api/posts/tags (trending)", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("returns trending tags mapped to { tag, count }", async () => {
    mockRpc.mockResolvedValue({
      data: [
        { tag: "rpg", post_count: 12 },
        { tag: "gaming", post_count: 5 },
      ],
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/api/posts/tags");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tags).toEqual([
      { tag: "rpg", count: 12 },
      { tag: "gaming", count: 5 },
    ]);
    expect(mockRpc).toHaveBeenCalledWith("get_trending_post_tags", { tag_limit: 10 });
  });

  it("clamps the limit query param between 1 and 50", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const request = new NextRequest("http://localhost:3000/api/posts/tags?limit=999");
    await GET(request);

    expect(mockRpc).toHaveBeenCalledWith("get_trending_post_tags", { tag_limit: 50 });
  });

  it("falls back to default limit for invalid query param", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const request = new NextRequest("http://localhost:3000/api/posts/tags?limit=abc");
    await GET(request);

    expect(mockRpc).toHaveBeenCalledWith("get_trending_post_tags", { tag_limit: 10 });
  });

  it("returns an empty list when there are no tags", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const request = new NextRequest("http://localhost:3000/api/posts/tags");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tags).toEqual([]);
  });

  it("returns 500 when the RPC errors", async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error("boom") });

    const request = new NextRequest("http://localhost:3000/api/posts/tags");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
