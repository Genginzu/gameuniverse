import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createSWRWrapper } from "../../helpers/swr-wrapper";

const originalFetch = globalThis.fetch;

// Mock auth — mutable pour basculer entre authentifié / non-authentifié
let mockUser: { id: string } | null = { id: "user-123" };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

import { useUnreadCount } from "@/hooks/useUnreadCount";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("useUnreadCount", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUser = { id: "user-123" };
    mockFetch = vi.fn(() => Promise.resolve(jsonResponse({ count: 5 })));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should fetch unread count on mount when authenticated", async () => {
    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.count).toBe(5);
  });

  it("should not fetch when user is not authenticated", async () => {
    mockUser = null;

    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.count).toBe(0);
  });

  it("should re-fetch count on refresh", async () => {
    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.count).toBe(5);
    });

    mockFetch.mockImplementation(() => Promise.resolve(jsonResponse({ count: 10 })));

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.count).toBe(10);
    });
  });

  it("should fallback to 0 on error", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(jsonResponse({ error: "Server error" }, 500))
    );

    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.count).toBe(0);
  });

  it("should not refresh when user is not authenticated", async () => {
    mockUser = null;

    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createSWRWrapper(),
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
