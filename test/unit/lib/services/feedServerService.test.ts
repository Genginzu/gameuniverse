import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockRpc = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve({ rpc: mockRpc })),
}));

import { FeedServerService } from "@/lib/services/feedServerService";

beforeEach(() => vi.clearAllMocks());

describe("FeedServerService", () => {
  it("returns paginated feed events", async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        events: [
          {
            id: "e1",
            type: "review",
            date: "2026-04-18T00:00:00Z",
            data: { type: "review", actor: { id: "u1", username: "alice", avatarUrl: null } },
          },
        ],
        totalCount: 25,
      },
      error: null,
    });

    const result = await FeedServerService.fetchSubscribedFeed("viewer", "fr", 1);

    expect(result.events).toHaveLength(1);
    expect(result.pagination.currentPage).toBe(1);
    expect(result.pagination.totalPages).toBe(2);
    expect(result.pagination.hasNextPage).toBe(true);
  });

  it("handles PGRST205 gracefully and returns empty response", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST205", message: "not found" },
    });

    const result = await FeedServerService.fetchSubscribedFeed("viewer", "fr", 1);

    expect(result.events).toEqual([]);
    expect(result.pagination.totalPages).toBe(0);
  });

  it("handles 42883 (function does not exist) gracefully", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { code: "42883", message: "function does not exist" },
    });

    const result = await FeedServerService.fetchSubscribedFeed("viewer", "fr", 1);

    expect(result.events).toEqual([]);
    expect(result.pagination.hasNextPage).toBe(false);
  });

  it("throws on other RPC errors", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { code: "50000", message: "boom" },
    });

    await expect(FeedServerService.fetchSubscribedFeed("viewer", "fr", 1)).rejects.toBeDefined();
  });

  it("returns hasNextPage=false on last page", async () => {
    mockRpc.mockResolvedValueOnce({
      data: { events: [], totalCount: 40 },
      error: null,
    });

    const result = await FeedServerService.fetchSubscribedFeed("viewer", "fr", 2);

    expect(result.pagination.currentPage).toBe(2);
    expect(result.pagination.totalPages).toBe(2);
    expect(result.pagination.hasNextPage).toBe(false);
  });
});
