import { describe, it, expect, beforeEach, jest } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { useUserLibrary } from "../useUserLibrary";

// Mock the useAuth hook
const mockUser = { id: "user-123", email: "test@example.com" };
jest.mock("../useAuth", () => ({
  useAuth: jest.fn(() => ({ user: mockUser })),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("useUserLibrary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it("should initialize with loading state", () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ games: [] }),
    });

    const { result } = renderHook(() => useUserLibrary());

    expect(result.current.loading).toBe(true);
    expect(result.current.games).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should fetch library and stats successfully", async () => {
    const mockGames = [
      {
        id: "game-1",
        title: "Test Game 1",
        slug: "test-game-1",
        developer: "Test Dev",
        publisher: "Test Pub",
        genres: [{ name: "Action" }],
      },
    ];

    const mockStats = {
      totalGames: 1,
      ownedGames: 1,
      completedGames: 0,
      totalPlayTime: 10,
      averageRating: 4.5,
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ games: mockGames }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

    const { result } = renderHook(() => useUserLibrary());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.games).toEqual(mockGames);
    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith("/api/library");
    expect(mockFetch).toHaveBeenCalledWith("/api/library/stats");
  });

  it("should handle fetch error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useUserLibrary());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.games).toEqual([]);
  });

  it("should add game to library successfully", async () => {
    const mockGames = [];
    const mockStats = { totalGames: 0, ownedGames: 0, completedGames: 0, totalPlayTime: 0 };

    // Initial fetch calls
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ games: mockGames }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      })
      // Add to library call
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      // Refetch calls after adding
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ games: [{ id: "game-1", title: "New Game" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ totalGames: 1, ownedGames: 1, completedGames: 0, totalPlayTime: 0 }),
      });

    const { result } = renderHook(() => useUserLibrary());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const success = await result.current.addToLibrary("game-1");

    expect(success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith("/api/library", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameId: "game-1", status: "owned" }),
    });
  });
});
