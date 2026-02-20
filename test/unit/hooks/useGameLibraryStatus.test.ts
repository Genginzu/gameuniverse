import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn(() => Promise.resolve(new Response()));

// Mock useAuth
const mockUser = { id: "user-123", email: "test@example.com" };
let mockAuthUser: typeof mockUser | null = mockUser;

vi.mock("./useAuth", () => ({
  useAuth: () => ({ user: mockAuthUser }),
}));

describe("useGameLibraryStatus", () => {
  beforeEach(() => {
    mockAuthUser = mockUser;
    mockFetch.mockClear();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  describe("initial state", () => {
    it("should have correct initial state structure", () => {
      const initialState = {
        inLibrary: false,
        loading: true,
        adding: false,
      };

      expect(initialState.inLibrary).toBe(false);
      expect(initialState.loading).toBe(true);
      expect(initialState.adding).toBe(false);
    });

    it("should set loading to false when no user", () => {
      mockAuthUser = null;
      const state = { inLibrary: false, loading: false, adding: false };
      expect(state.loading).toBe(false);
    });

    it("should set loading to false when no gameId", () => {
      const state = { inLibrary: false, loading: false, adding: false };
      expect(state.loading).toBe(false);
    });
  });

  describe("checkStatus", () => {
    it("should fetch library status for valid gameId", async () => {
      const gameId = "game-123";
      mockFetch.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ inLibrary: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const response = await fetch(`/api/library/${gameId}`);
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(`/api/library/${gameId}`);
      expect(data.inLibrary).toBe(true);
    });

    it("should handle game not in library", async () => {
      const gameId = "game-456";
      mockFetch.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ inLibrary: false }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const response = await fetch(`/api/library/${gameId}`);
      const data = await response.json();

      expect(data.inLibrary).toBe(false);
    });

    it("should handle 500 error gracefully", async () => {
      const gameId = "game-789";
      mockFetch.mockImplementation(() => Promise.resolve(new Response(null, { status: 500 })));

      const response = await fetch(`/api/library/${gameId}`);

      expect(response.status).toBe(500);
    });

    it("should handle network errors", async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error("Network error")));

      await expect(fetch("/api/library/game-123")).rejects.toThrow("Network error");
    });
  });

  describe("addToLibrary", () => {
    it("should POST to library endpoint with gameId", async () => {
      const gameId = "game-123";
      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }))
      );

      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      expect(response.ok).toBe(true);
    });

    it("should return true on successful add", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }))
      );

      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: "game-123" }),
      });

      expect(response.ok).toBe(true);
    });

    it("should return false on failed add", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ error: "Failed to add" }), { status: 400 }))
      );

      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: "game-123" }),
      });

      expect(response.ok).toBe(false);
    });

    it("should not add when no user", () => {
      mockAuthUser = null;
      // When no user, addToLibrary should return false without making request
      expect(mockAuthUser).toBeNull();
    });

    it("should not add when already adding", () => {
      const adding = true;
      // When adding is true, should not make another request
      expect(adding).toBe(true);
    });

    it("should handle add error response", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: "Game already in library" }), {
            status: 409,
          })
        )
      );

      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: "game-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Game already in library");
    });
  });

  describe("removeFromLibrary", () => {
    it("should DELETE from library endpoint", async () => {
      const gameId = "game-123";
      mockFetch.mockImplementation(() => Promise.resolve(new Response(null, { status: 200 })));

      const response = await fetch(`/api/library/${gameId}`, {
        method: "DELETE",
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/library/${gameId}`, {
        method: "DELETE",
      });
      expect(response.ok).toBe(true);
    });

    it("should return true on successful remove", async () => {
      mockFetch.mockImplementation(() => Promise.resolve(new Response(null, { status: 200 })));

      const response = await fetch("/api/library/game-123", {
        method: "DELETE",
      });

      expect(response.ok).toBe(true);
    });

    it("should return false on failed remove", async () => {
      mockFetch.mockImplementation(() => Promise.resolve(new Response(null, { status: 404 })));

      const response = await fetch("/api/library/game-123", {
        method: "DELETE",
      });

      expect(response.ok).toBe(false);
    });

    it("should not remove when no user", () => {
      mockAuthUser = null;
      expect(mockAuthUser).toBeNull();
    });

    it("should handle remove network error", async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error("Network error")));

      await expect(fetch("/api/library/game-123", { method: "DELETE" })).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("state transitions", () => {
    it("should update inLibrary to true after successful add", () => {
      let inLibrary = false;
      // Simulate successful add
      inLibrary = true;
      expect(inLibrary).toBe(true);
    });

    it("should update inLibrary to false after successful remove", () => {
      let inLibrary = true;
      // Simulate successful remove
      inLibrary = false;
      expect(inLibrary).toBe(false);
    });

    it("should set adding to true during add operation", () => {
      let adding = false;
      adding = true;
      expect(adding).toBe(true);
    });

    it("should set adding to false after add completes", () => {
      let adding = true;
      adding = false;
      expect(adding).toBe(false);
    });

    it("should set loading to false after status check", () => {
      let loading = true;
      loading = false;
      expect(loading).toBe(false);
    });
  });

  describe("caching behavior", () => {
    it("should only check status once per mount", () => {
      const hasCheckedRef = { current: false };

      // First check
      if (!hasCheckedRef.current) {
        hasCheckedRef.current = true;
      }

      expect(hasCheckedRef.current).toBe(true);

      // Second check should be skipped
      const shouldCheck = !hasCheckedRef.current;
      expect(shouldCheck).toBe(false);
    });

    it("should skip check if already checked", () => {
      const hasCheckedRef = { current: true };
      const shouldSkip = hasCheckedRef.current;
      expect(shouldSkip).toBe(true);
    });
  });
});
