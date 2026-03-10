import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// Mutable mock user — allows toggling auth state between tests
let mockUser: { id: string } | null = { id: "user-123" };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/lib/services/friendService", () => ({
  FriendService: {
    getPendingCount: vi.fn(),
  },
}));

import { usePendingRequestCount } from "@/hooks/usePendingRequestCount";
import { FriendService } from "@/lib/services/friendService";

const mockedGetPendingCount = FriendService.getPendingCount as ReturnType<typeof vi.fn>;

describe("usePendingRequestCount", () => {
  beforeEach(() => {
    mockUser = { id: "user-123" };
    mockedGetPendingCount.mockReset();
    mockedGetPendingCount.mockResolvedValue({ count: 3 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Requirements 3.1, 4.1 — Initial fetch on mount ---
  it("should fetch pending count on mount when authenticated", async () => {
    const { result } = renderHook(() => usePendingRequestCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedGetPendingCount).toHaveBeenCalledOnce();
    expect(result.current.count).toBe(3);
  });

  // --- Requirement 3.4 — No fetch when unauthenticated ---
  it("should not fetch when user is not authenticated", async () => {
    mockUser = null;

    const { result } = renderHook(() => usePendingRequestCount());

    // Give time for any potential async call
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedGetPendingCount).not.toHaveBeenCalled();
    expect(result.current.count).toBe(0);
  });

  // --- Requirement 3.4 — Decrement after accept/decline ---
  it("should decrement count by 1 and not go below 0", async () => {
    mockedGetPendingCount.mockResolvedValue({ count: 1 });

    const { result } = renderHook(() => usePendingRequestCount());

    await waitFor(() => {
      expect(result.current.count).toBe(1);
    });

    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(0);

    // Should not go below 0
    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(0);
  });

  // --- Requirement 3.4 — Refresh re-fetches the count ---
  it("should re-fetch count on refresh", async () => {
    const { result } = renderHook(() => usePendingRequestCount());

    await waitFor(() => {
      expect(result.current.count).toBe(3);
    });

    mockedGetPendingCount.mockResolvedValue({ count: 5 });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.count).toBe(5);
    expect(mockedGetPendingCount).toHaveBeenCalledTimes(2);
  });

  // --- Error fallback — silent fallback to 0 ---
  it("should fallback to 0 on error", async () => {
    mockedGetPendingCount.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePendingRequestCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.count).toBe(0);
  });

  // --- Refresh should not fetch when unauthenticated ---
  it("should not refresh when user is not authenticated", async () => {
    mockUser = null;

    const { result } = renderHook(() => usePendingRequestCount());

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockedGetPendingCount).not.toHaveBeenCalled();
  });
});
