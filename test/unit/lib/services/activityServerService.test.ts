import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockRpc = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve({ rpc: mockRpc })),
}));

import { ActivityServerService } from "@/lib/services/activityServerService";

beforeEach(() => vi.clearAllMocks());

describe("ActivityServerService", () => {
  it("returns activity events", async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        events: [{ id: "1", type: "game_added", date: "2024-01-01", data: {} }],
        totalCount: 1,
      },
      error: null,
    });
    const result = await ActivityServerService.fetchPlayerActivity("p1", "fr");
    expect(result.events).toHaveLength(1);
    expect(result.pagination.totalPages).toBe(1);
  });

  it("handles PGRST205 error gracefully", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST205", message: "not found" },
    });
    const result = await ActivityServerService.fetchPlayerActivity("p1", "fr");
    expect(result.events).toEqual([]);
    expect(result.pagination.totalPages).toBe(0);
  });

  it("throws on other errors", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: "500", message: "server error" } });
    await expect(ActivityServerService.fetchPlayerActivity("p1", "fr")).rejects.toThrow();
  });
});
