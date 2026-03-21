import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createSWRWrapper } from "../../helpers/swr-wrapper";

const originalFetch = globalThis.fetch;

// Mock auth — mutable pour basculer entre authentifié / non-authentifié
let mockUser: { id: string } | null = { id: "user-123" };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

import { usePendingRequestCount } from "@/hooks/usePendingRequestCount";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("usePendingRequestCount", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUser = { id: "user-123" };
    mockFetch = vi.fn(() => Promise.resolve(jsonResponse({ count: 3 })));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should fetch pending count on mount when authenticated", async () => {
    const { result } = renderHook(() => usePendingRequestCount(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.count).toBe(3);
  });

  it("should not fetch when user is not authenticated", async () => {
    mockUser = null;

    const { result } = renderHook(() => usePendingRequestCount(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.count).toBe(0);
  });

  it("should decrement count by 1 and not go below 0", async () => {
    mockFetch.mockImplementation(() => Promise.resolve(jsonResponse({ count: 1 })));

    const { result } = renderHook(() => usePendingRequestCount(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.count).toBe(1);
    });

    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(0);

    // Ne doit pas descendre en dessous de 0
    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(0);
  });

  it("should re-fetch count on refresh", async () => {
    const { result } = renderHook(() => usePendingRequestCount(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.count).toBe(3);
    });

    // Changer la réponse pour le prochain fetch
    mockFetch.mockImplementation(() => Promise.resolve(jsonResponse({ count: 5 })));

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.count).toBe(5);
    });
  });

  it("should fallback to 0 on error", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(jsonResponse({ error: "Server error" }, 500))
    );

    const { result } = renderHook(() => usePendingRequestCount(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Le hook gère l'erreur silencieusement → count = 0
    expect(result.current.count).toBe(0);
  });

  it("should not refresh when user is not authenticated", async () => {
    mockUser = null;

    const { result } = renderHook(() => usePendingRequestCount(), {
      wrapper: createSWRWrapper(),
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
