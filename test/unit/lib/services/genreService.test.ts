import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GenreService } from "@/lib/services/genreService";

const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = vi.fn() as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("GenreService", () => {
  it("fetches genres", async () => {
    const genres = [{ id: "g1", slug: "rpg", name: "RPG", gameCount: 10 }];
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ genres }),
    } as Response);
    const result = await GenreService.fetchGenres("fr");
    expect(result).toEqual(genres);
  });

  it("handles error", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);
    await expect(GenreService.fetchGenres("fr")).rejects.toThrow("Failed to fetch genres");
  });
});
