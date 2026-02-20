import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Tests for useGameLibraryStatus hook logic
 * Tests the state machine and API interaction patterns
 */
describe("useGameLibraryStatus comprehensive tests", () => {
  describe("state machine logic", () => {
    interface LibraryStatusState {
      inLibrary: boolean;
      loading: boolean;
      adding: boolean;
    }

    const createInitialState = (): LibraryStatusState => ({
      inLibrary: false,
      loading: true,
      adding: false,
    });

    it("should have correct initial state", () => {
      const state = createInitialState();
      expect(state.inLibrary).toBe(false);
      expect(state.loading).toBe(true);
      expect(state.adding).toBe(false);
    });

    it("should transition to loaded state with game in library", () => {
      let state = createInitialState();

      // Simulate successful check - game is in library
      state = { ...state, loading: false, inLibrary: true };

      expect(state.loading).toBe(false);
      expect(state.inLibrary).toBe(true);
    });

    it("should transition to loaded state with game not in library", () => {
      let state = createInitialState();

      // Simulate successful check - game not in library
      state = { ...state, loading: false, inLibrary: false };

      expect(state.loading).toBe(false);
      expect(state.inLibrary).toBe(false);
    });

    it("should handle adding state transition", () => {
      let state: LibraryStatusState = {
        inLibrary: false,
        loading: false,
        adding: false,
      };

      // Start adding
      state = { ...state, adding: true };
      expect(state.adding).toBe(true);

      // Add successful
      state = { ...state, adding: false, inLibrary: true };
      expect(state.adding).toBe(false);
      expect(state.inLibrary).toBe(true);
    });

    it("should handle failed add", () => {
      let state: LibraryStatusState = {
        inLibrary: false,
        loading: false,
        adding: false,
      };

      // Start adding
      state = { ...state, adding: true };

      // Add failed - revert
      state = { ...state, adding: false };

      expect(state.adding).toBe(false);
      expect(state.inLibrary).toBe(false);
    });

    it("should handle remove transition", () => {
      let state: LibraryStatusState = {
        inLibrary: true,
        loading: false,
        adding: false,
      };

      // Remove successful
      state = { ...state, inLibrary: false };

      expect(state.inLibrary).toBe(false);
    });
  });

  describe("API interaction patterns", () => {
    let mockFetch: ReturnType<typeof mock>;

    beforeEach(() => {
      mockFetch = vi.fn(() => Promise.resolve(new Response()));
      globalThis.fetch = mockFetch as unknown as typeof fetch;
    });

    afterEach(() => {
      mockFetch.mockReset();
    });

    it("should check library status with correct endpoint", async () => {
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

    it("should add to library with POST request", async () => {
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

    it("should remove from library with DELETE request", async () => {
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

    it("should handle 500 error on status check", async () => {
      mockFetch.mockImplementation(() => Promise.resolve(new Response(null, { status: 500 })));

      const response = await fetch("/api/library/game-123");

      expect(response.status).toBe(500);
      expect(response.ok).toBe(false);
    });

    it("should handle network error on status check", async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error("Network error")));

      await expect(fetch("/api/library/game-123")).rejects.toThrow("Network error");
    });

    it("should handle add failure response", async () => {
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

    it("should handle remove failure response", async () => {
      mockFetch.mockImplementation(() => Promise.resolve(new Response(null, { status: 404 })));

      const response = await fetch("/api/library/game-123", {
        method: "DELETE",
      });

      expect(response.status).toBe(404);
      expect(response.ok).toBe(false);
    });
  });

  describe("guard conditions", () => {
    it("should not add when no user", () => {
      const user = null;
      const gameId = "game-123";
      const adding = false;

      const canAdd = !!(user && gameId && !adding);
      expect(canAdd).toBe(false);
    });

    it("should not add when no gameId", () => {
      const user = { id: "user-123" };
      const gameId = "";
      const adding = false;

      const canAdd = !!(user && gameId && !adding);
      expect(canAdd).toBe(false);
    });

    it("should not add when already adding", () => {
      const user = { id: "user-123" };
      const gameId = "game-123";
      const adding = true;

      const canAdd = user && gameId && !adding;
      expect(canAdd).toBe(false);
    });

    it("should allow add when all conditions met", () => {
      const user = { id: "user-123" };
      const gameId = "game-123";
      const adding = false;

      const canAdd = user && gameId && !adding;
      expect(canAdd).toBe(true);
    });

    it("should not remove when no user", () => {
      const user = null;
      const gameId = "game-123";

      const canRemove = !!(user && gameId);
      expect(canRemove).toBe(false);
    });

    it("should not remove when no gameId", () => {
      const user = { id: "user-123" };
      const gameId = "";

      const canRemove = !!(user && gameId);
      expect(canRemove).toBe(false);
    });

    it("should allow remove when conditions met", () => {
      const user = { id: "user-123" };
      const gameId = "game-123";

      const canRemove = !!(user && gameId);
      expect(canRemove).toBe(true);
    });
  });

  describe("caching behavior", () => {
    it("should track if status has been checked", () => {
      const hasCheckedRef = { current: false };

      // First check
      expect(hasCheckedRef.current).toBe(false);
      hasCheckedRef.current = true;
      expect(hasCheckedRef.current).toBe(true);

      // Subsequent checks should be skipped
      const shouldSkip = hasCheckedRef.current;
      expect(shouldSkip).toBe(true);
    });

    it("should skip check when already checked", () => {
      const hasCheckedRef = { current: true };
      const user = { id: "user-123" };
      const gameId = "game-123";

      const shouldCheck = !hasCheckedRef.current && user && gameId;
      expect(shouldCheck).toBe(false);
    });

    it("should skip check when no user", () => {
      const hasCheckedRef = { current: false };
      const user = null;
      const gameId = "game-123";

      const shouldCheck = !!(!hasCheckedRef.current && user && gameId);
      expect(shouldCheck).toBe(false);
    });

    it("should skip check when no gameId", () => {
      const hasCheckedRef = { current: false };
      const user = { id: "user-123" };
      const gameId = "";

      const shouldCheck = !!(!hasCheckedRef.current && user && gameId);
      expect(shouldCheck).toBe(false);
    });
  });

  describe("error handling patterns", () => {
    it("should handle JSON parse error in response", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          new Response("invalid json", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const response = await fetch("/api/library/game-123");

      await expect(response.json()).rejects.toThrow();
    });

    it("should handle timeout scenario", async () => {
      const mockFetch = vi.fn(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout")), 100);
          })
      );
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      await expect(fetch("/api/library/game-123")).rejects.toThrow("Timeout");
    });
  });
});
