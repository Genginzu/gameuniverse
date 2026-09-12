import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { fetchGameGenreIds, fetchAllGameGenres } from "@/lib/services/recommendation/dataFetchers";

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({ eq: mockEq });
});

describe("fetchGameGenreIds", () => {
  it("returns genre IDs for a game", async () => {
    mockEq.mockResolvedValue({ data: [{ genre_id: "g1" }, { genre_id: "g2" }], error: null });
    const result = await fetchGameGenreIds("game1");
    expect(result).toEqual(["g1", "g2"]);
    expect(mockFrom).toHaveBeenCalledWith("game_genres");
  });

  it("throws on error", async () => {
    mockEq.mockResolvedValue({ data: null, error: { message: "DB error" } });
    await expect(fetchGameGenreIds("game1")).rejects.toThrow("Failed to fetch genres");
  });
});

describe("fetchAllGameGenres", () => {
  it("returns map of game to genre IDs", async () => {
    mockSelect.mockResolvedValue({
      data: [
        { game_id: "a", genre_id: "g1" },
        { game_id: "a", genre_id: "g2" },
        { game_id: "b", genre_id: "g1" },
      ],
      error: null,
    });
    const result = await fetchAllGameGenres();
    expect(result.get("a")).toEqual(["g1", "g2"]);
    expect(result.get("b")).toEqual(["g1"]);
  });

  it("throws on error", async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: "fail" } });
    await expect(fetchAllGameGenres()).rejects.toThrow("Failed to fetch all game genres");
  });
});
