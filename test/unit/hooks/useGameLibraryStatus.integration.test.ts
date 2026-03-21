// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createSWRWrapper } from "../../helpers/swr-wrapper";

const originalFetch = globalThis.fetch;

// Mock auth — mutable pour basculer entre authentifié / non-authentifié
let mockUser: { id: string } | null = { id: "user-123" };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

import { useGameLibraryStatus } from "@/hooks/useGameLibraryStatus";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("useGameLibraryStatus", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUser = { id: "user-123" };
    mockFetch = vi.fn(() => Promise.resolve(jsonResponse({ inLibrary: true })));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("hook initialization", () => {
    it("should return library status and functions", async () => {
      const { result } = renderHook(() => useGameLibraryStatus("game-123"), {
        wrapper: createSWRWrapper(),
      });

      expect(result.current).toHaveProperty("inLibrary");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("adding");
      expect(result.current).toHaveProperty("addToLibrary");
      expect(result.current).toHaveProperty("removeFromLibrary");
    });
  });

  describe("status check on mount", () => {
    it("should fetch status when user and gameId exist", async () => {
      const { result } = renderHook(() => useGameLibraryStatus("game-789"), {
        wrapper: createSWRWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.inLibrary).toBe(true);
    });

    it("should not fetch when no gameId", async () => {
      const { result } = renderHook(() => useGameLibraryStatus(""), {
        wrapper: createSWRWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.inLibrary).toBe(false);
    });

    it("should not fetch when no user", async () => {
      mockUser = null;

      const { result } = renderHook(() => useGameLibraryStatus("game-789"), {
        wrapper: createSWRWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.inLibrary).toBe(false);
    });
  });

  describe("addToLibrary", () => {
    it("should POST to /api/library with gameId", async () => {
      // SWR GET pour le status initial
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "POST") {
          return Promise.resolve(jsonResponse({}));
        }
        return Promise.resolve(jsonResponse({ inLibrary: false }));
      });

      const { result } = renderHook(() => useGameLibraryStatus("game-123"), {
        wrapper: createSWRWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addToLibrary();
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: "game-123" }),
      });
    });

    it("should return true on success", async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "POST") {
          return Promise.resolve(jsonResponse({}));
        }
        return Promise.resolve(jsonResponse({ inLibrary: false }));
      });

      const { result } = renderHook(() => useGameLibraryStatus("game-123"), {
        wrapper: createSWRWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let addResult: boolean | undefined;
      await act(async () => {
        addResult = await result.current.addToLibrary();
      });

      expect(addResult).toBe(true);
    });

    it("should return false when no user", async () => {
      mockUser = null;

      const { result } = renderHook(() => useGameLibraryStatus("game-123"), {
        wrapper: createSWRWrapper(),
      });

      let addResult: boolean | undefined;
      await act(async () => {
        addResult = await result.current.addToLibrary();
      });

      expect(addResult).toBe(false);
    });

    it("should return false when no gameId", async () => {
      const { result } = renderHook(() => useGameLibraryStatus(""), {
        wrapper: createSWRWrapper(),
      });

      let addResult: boolean | undefined;
      await act(async () => {
        addResult = await result.current.addToLibrary();
      });

      expect(addResult).toBe(false);
    });

    it("should return false on API error", async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "POST") {
          return Promise.resolve(new Response(null, { status: 500 }));
        }
        return Promise.resolve(jsonResponse({ inLibrary: false }));
      });

      const { result } = renderHook(() => useGameLibraryStatus("game-123"), {
        wrapper: createSWRWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let addResult: boolean | undefined;
      await act(async () => {
        addResult = await result.current.addToLibrary();
      });

      expect(addResult).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "POST") {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve(jsonResponse({ inLibrary: false }));
      });

      const { result } = renderHook(() => useGameLibraryStatus("game-123"), {
        wrapper: createSWRWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let addResult: boolean | undefined;
      await act(async () => {
        addResult = await result.current.addToLibrary();
      });

      expect(addResult).toBe(false);
    });
  });

  describe("removeFromLibrary", () => {
    it("should DELETE from /api/library/{gameId}", async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "DELETE") {
          return Promise.resolve(new Response(null, { status: 200 }));
        }
        return Promise.resolve(jsonResponse({ inLibrary: true }));
      });

      const { result } = renderHook(() => useGameLibraryStatus("game-456"), {
        wrapper: createSWRWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.removeFromLibrary();
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/library/game-456", {
        method: "DELETE",
      });
    });

    it("should return true on success", async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "DELETE") {
          return Promise.resolve(new Response(null, { status: 200 }));
        }
        return Promise.resolve(jsonResponse({ inLibrary: true }));
      });

      const { result } = renderHook(() => useGameLibraryStatus("game-456"), {
        wrapper: createSWRWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let removeResult: boolean | undefined;
      await act(async () => {
        removeResult = await result.current.removeFromLibrary();
      });

      expect(removeResult).toBe(true);
    });

    it("should return false when no user", async () => {
      mockUser = null;

      const { result } = renderHook(() => useGameLibraryStatus("game-456"), {
        wrapper: createSWRWrapper(),
      });

      let removeResult: boolean | undefined;
      await act(async () => {
        removeResult = await result.current.removeFromLibrary();
      });

      expect(removeResult).toBe(false);
    });

    it("should return false when no gameId", async () => {
      const { result } = renderHook(() => useGameLibraryStatus(""), {
        wrapper: createSWRWrapper(),
      });

      let removeResult: boolean | undefined;
      await act(async () => {
        removeResult = await result.current.removeFromLibrary();
      });

      expect(removeResult).toBe(false);
    });

    it("should return false on API error", async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "DELETE") {
          return Promise.resolve(new Response(null, { status: 500 }));
        }
        return Promise.resolve(jsonResponse({ inLibrary: true }));
      });

      const { result } = renderHook(() => useGameLibraryStatus("game-456"), {
        wrapper: createSWRWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let removeResult: boolean | undefined;
      await act(async () => {
        removeResult = await result.current.removeFromLibrary();
      });

      expect(removeResult).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "DELETE") {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve(jsonResponse({ inLibrary: true }));
      });

      const { result } = renderHook(() => useGameLibraryStatus("game-456"), {
        wrapper: createSWRWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let removeResult: boolean | undefined;
      await act(async () => {
        removeResult = await result.current.removeFromLibrary();
      });

      expect(removeResult).toBe(false);
    });
  });
});
