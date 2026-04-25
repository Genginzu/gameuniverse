import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAdminGames } from "@/hooks/useAdminGames";

vi.mock("next-intl", () => ({ useLocale: () => "fr" }));

const mockGame = {
  id: "1",
  slug: "test",
  title: "Test",
  coverImage: null,
  releaseDate: null,
  updatedAt: "2024-01-01",
};

const mockPagination = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 1,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

const mockResponse = () =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ games: [mockGame], pagination: mockPagination }),
  });

describe("useAdminGames", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockImplementation(mockResponse);
  });

  it("fetches games on mount", async () => {
    const { result } = renderHook(() => useAdminGames());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.games).toEqual([mockGame]);
    expect(result.current.pagination).toEqual(mockPagination);
    expect(result.current.error).toBeNull();
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/admin/games?"));
  });

  it("includes search param in URL", async () => {
    const { result } = renderHook(() => useAdminGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.fetchGames({ search: "zelda" }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    const lastCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.at(
      -1
    )?.[0] as string;
    expect(lastCall).toContain("search=zelda");
  });

  it("deleteGame calls DELETE then refetches", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockImplementationOnce(mockResponse) // initial fetch
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) // DELETE
      .mockImplementationOnce(mockResponse); // refetch

    const { result } = renderHook(() => useAdminGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.deleteGame("1"));

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/games/1", { method: "DELETE" });
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it("sets error on fetch failure", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      })
    );

    const { result } = renderHook(() => useAdminGames());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("Server error");
    expect(result.current.games).toEqual([]);
  });
});
