import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePlayerActivity } from "@/hooks/usePlayerActivity";

const mockActivityResponse = {
  events: [{ id: "a1", type: "review", createdAt: "2024-01-01" }],
  pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
};

describe("usePlayerActivity", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockActivityResponse),
    });
  });

  it("returns loading initially", () => {
    const { result } = renderHook(() => usePlayerActivity("player-1", "fr"));
    expect(result.current.isLoading).toBe(true);
  });

  it("returns activities after fetch", async () => {
    const { result } = renderHook(() => usePlayerActivity("player-1", "fr"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events).toEqual(mockActivityResponse.events);
    expect(result.current.error).toBeNull();
  });

  it("handles error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const { result } = renderHook(() => usePlayerActivity("player-1", "fr"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toContain("Server error");
  });
});
