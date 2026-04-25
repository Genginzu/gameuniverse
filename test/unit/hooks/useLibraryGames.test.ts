import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createSWRWrapper } from "../../helpers/swr-wrapper";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "user1" } }) }));

import { useLibraryGames } from "@/hooks/useLibraryGames";

const mockGamesResponse = {
  games: [{ id: "g1", title: "Zelda", slug: "zelda" }],
  pagination: { currentPage: 1, totalPages: 1, totalCount: 1, hasNextPage: false },
};

const mockStatsResponse = { totalGames: 5, completedGames: 2, totalPlayTime: 120 };
const mockGenresResponse = { genres: [{ id: "gen1", name: "RPG", slug: "rpg" }] };

describe("useLibraryGames", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/games")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGamesResponse) });
      }
      if (typeof url === "string" && url.includes("/api/library/stats")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStatsResponse) });
      }
      if (typeof url === "string" && url.includes("/api/genres")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGenresResponse) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("fetches library games via SWR", async () => {
    const { result } = renderHook(() => useLibraryGames("fr"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.initialLoading).toBe(false));

    expect(result.current.games).toEqual(mockGamesResponse.games);
    expect(result.current.stats.totalGames).toBe(5);
    expect(result.current.genres).toEqual(mockGenresResponse.genres);
  });

  it("returns empty array when no data yet", () => {
    // Before SWR resolves, games defaults to []
    const { result } = renderHook(() => useLibraryGames("fr"), {
      wrapper: createSWRWrapper(),
    });

    expect(result.current.games).toEqual([]);
    expect(result.current.stats.totalGames).toBe(0);
  });

  it("builds SWR key with inLibrary=true", async () => {
    const { result } = renderHook(() => useLibraryGames("fr"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.initialLoading).toBe(false));

    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining("inLibrary=true"));
  });
});
