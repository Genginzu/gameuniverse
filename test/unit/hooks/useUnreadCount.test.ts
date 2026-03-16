import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// Mutable mock user — allows toggling auth state between tests
let mockUser: { id: string } | null = { id: "user-123" };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/lib/services/discussionService", () => ({
  DiscussionService: {
    fetchUnreadCount: vi.fn(),
  },
}));

import { useUnreadCount } from "@/hooks/useUnreadCount";
import { DiscussionService } from "@/lib/services/discussionService";

const mockedFetchUnreadCount = DiscussionService.fetchUnreadCount as ReturnType<typeof vi.fn>;

describe("useUnreadCount", () => {
  beforeEach(() => {
    mockUser = { id: "user-123" };
    mockedFetchUnreadCount.mockReset();
    mockedFetchUnreadCount.mockResolvedValue({ count: 5 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Requirements 1.4, 5.2 — Fetches unread count on mount ---
  it("should fetch unread count on mount when authenticated", async () => {
    const { result } = renderHook(() => useUnreadCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedFetchUnreadCount).toHaveBeenCalledOnce();
    expect(result.current.count).toBe(5);
  });

  // --- No fetch when unauthenticated ---
  it("should not fetch when user is not authenticated", async () => {
    mockUser = null;

    const { result } = renderHook(() => useUnreadCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedFetchUnreadCount).not.toHaveBeenCalled();
    expect(result.current.count).toBe(0);
  });

  // --- Requirement 5.2 — Re-fetches count on refresh ---
  it("should re-fetch count on refresh", async () => {
    const { result } = renderHook(() => useUnreadCount());

    await waitFor(() => {
      expect(result.current.count).toBe(5);
    });

    mockedFetchUnreadCount.mockResolvedValue({ count: 10 });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.count).toBe(10);
    expect(mockedFetchUnreadCount).toHaveBeenCalledTimes(2);
  });

  // --- Error fallback — silent fallback to 0 ---
  it("should fallback to 0 on error", async () => {
    mockedFetchUnreadCount.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useUnreadCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.count).toBe(0);
  });

  // --- Refresh should not fetch when unauthenticated ---
  it("should not refresh when user is not authenticated", async () => {
    mockUser = null;

    const { result } = renderHook(() => useUnreadCount());

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockedFetchUnreadCount).not.toHaveBeenCalled();
  });
});
