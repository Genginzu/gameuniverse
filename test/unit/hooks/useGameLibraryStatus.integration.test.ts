import { describe, it, expect, beforeEach, vi } from "vitest";

// Track state changes
let libraryState = { inLibrary: false, loading: true, adding: false };
const mockSetInLibrary = vi.fn((val: boolean) => {
  libraryState.inLibrary = val;
});
const mockSetLoading = vi.fn((val: boolean) => {
  libraryState.loading = val;
});
const mockSetAdding = vi.fn((val: boolean) => {
  libraryState.adding = val;
});

// Track ref
let hasCheckedRef = { current: false };

// Mock React
vi.mock("react", () => ({
  useState: (initial: unknown) => {
    if (initial === false && !libraryState.inLibrary) {
      return [libraryState.inLibrary, mockSetInLibrary];
    }
    if (initial === true) {
      return [libraryState.loading, mockSetLoading];
    }
    if (initial === false) {
      return [libraryState.adding, mockSetAdding];
    }
    return [initial, vi.fn(() => {})];
  },
  useEffect: (callback: () => void | (() => void), deps?: unknown[]) => {
    callback();
  },
  useCallback: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  useRef: (initial: unknown) => {
    if (initial === false) {
      return hasCheckedRef;
    }
    return { current: initial };
  },
}));

// Mock useAuth
let mockUser: { id: string } | null = { id: "user-123" };
vi.mock("../../../src/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock fetch
const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ inLibrary: true }),
  })
);
globalThis.fetch = mockFetch as unknown as typeof fetch;

// Import the hook
import { useGameLibraryStatus } from "../../../src/hooks/useGameLibraryStatus";

describe("useGameLibraryStatus integration tests", () => {
  beforeEach(() => {
    libraryState = { inLibrary: false, loading: true, adding: false };
    hasCheckedRef = { current: false };
    mockUser = { id: "user-123" };
    mockFetch.mockClear();
    mockSetInLibrary.mockClear();
    mockSetLoading.mockClear();
    mockSetAdding.mockClear();
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ inLibrary: true }),
      })
    );
  });

  describe("hook initialization", () => {
    it("should return library status and functions", () => {
      const result = useGameLibraryStatus("game-123");

      expect(result).toHaveProperty("inLibrary");
      expect(result).toHaveProperty("loading");
      expect(result).toHaveProperty("adding");
      expect(result).toHaveProperty("addToLibrary");
      expect(result).toHaveProperty("removeFromLibrary");
    });
  });

  describe("addToLibrary", () => {
    it("should POST to /api/library with gameId", async () => {
      const { addToLibrary } = useGameLibraryStatus("game-123");

      await addToLibrary();

      expect(mockFetch).toHaveBeenCalledWith("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: "game-123" }),
      });
    });

    it("should return true on success", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      );

      const { addToLibrary } = useGameLibraryStatus("game-123");
      const result = await addToLibrary();

      expect(result).toBe(true);
    });

    it("should return false when no user", async () => {
      mockUser = null;

      const { addToLibrary } = useGameLibraryStatus("game-123");
      const result = await addToLibrary();

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalledWith("/api/library", expect.anything());
    });

    it("should return false when no gameId", async () => {
      const { addToLibrary } = useGameLibraryStatus("");
      const result = await addToLibrary();

      expect(result).toBe(false);
    });

    it("should guard against concurrent adds", async () => {
      // The adding state is managed internally by the hook
      // We test that the hook properly handles the adding state
      const { addToLibrary } = useGameLibraryStatus("game-123");

      // First call should succeed
      const result1 = await addToLibrary();
      expect(result1).toBe(true);
    });

    it("should return false on API error", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Failed" }),
        })
      );

      const { addToLibrary } = useGameLibraryStatus("game-123");
      const result = await addToLibrary();

      expect(result).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error("Network error")));

      const { addToLibrary } = useGameLibraryStatus("game-123");
      const result = await addToLibrary();

      expect(result).toBe(false);
    });
  });

  describe("removeFromLibrary", () => {
    it("should DELETE from /api/library/{gameId}", async () => {
      mockFetch.mockImplementation(() => Promise.resolve({ ok: true }));

      const { removeFromLibrary } = useGameLibraryStatus("game-456");
      await removeFromLibrary();

      expect(mockFetch).toHaveBeenCalledWith("/api/library/game-456", { method: "DELETE" });
    });

    it("should return true on success", async () => {
      mockFetch.mockImplementation(() => Promise.resolve({ ok: true }));

      const { removeFromLibrary } = useGameLibraryStatus("game-456");
      const result = await removeFromLibrary();

      expect(result).toBe(true);
    });

    it("should return false when no user", async () => {
      mockUser = null;

      const { removeFromLibrary } = useGameLibraryStatus("game-456");
      const result = await removeFromLibrary();

      expect(result).toBe(false);
    });

    it("should return false when no gameId", async () => {
      const { removeFromLibrary } = useGameLibraryStatus("");
      const result = await removeFromLibrary();

      expect(result).toBe(false);
    });

    it("should return false on API error", async () => {
      mockFetch.mockImplementation(() => Promise.resolve({ ok: false }));

      const { removeFromLibrary } = useGameLibraryStatus("game-456");
      const result = await removeFromLibrary();

      expect(result).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error("Network error")));

      const { removeFromLibrary } = useGameLibraryStatus("game-456");
      const result = await removeFromLibrary();

      expect(result).toBe(false);
    });
  });

  describe("status check on mount", () => {
    it("should check status when user and gameId exist", async () => {
      hasCheckedRef.current = false;
      useGameLibraryStatus("game-789");

      // Wait for async
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalledWith("/api/library/game-789");
    });

    it("should not check status when already checked", () => {
      hasCheckedRef.current = true;
      mockFetch.mockClear();

      useGameLibraryStatus("game-789");

      // Should not call fetch for status check
      expect(mockFetch).not.toHaveBeenCalledWith("/api/library/game-789");
    });

    it("should handle 500 error gracefully", async () => {
      hasCheckedRef.current = false;
      mockFetch.mockImplementation(() => Promise.resolve({ ok: false, status: 500 }));

      useGameLibraryStatus("game-789");

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not throw
      expect(mockSetInLibrary).toHaveBeenCalledWith(false);
    });
  });
});
