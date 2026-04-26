import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAdminSimilarGames } from "@/hooks/useAdminSimilarGames";
import { createSWRWrapper } from "../../helpers/swr-wrapper";

const originalFetch = globalThis.fetch;

const mockSimilarGames = [
  {
    id: "sg1",
    similarIgdbId: 100,
    displayOrder: 1,
    game: { id: "g1", slug: "zelda", title: "Zelda", coverImage: null },
  },
  {
    id: "sg2",
    similarIgdbId: 200,
    displayOrder: 2,
    game: { id: "g2", slug: "mario", title: "Mario", coverImage: null },
  },
];

function successFetch() {
  return vi.fn((url: string, opts?: RequestInit) => {
    if (opts?.method === "POST")
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });
    if (opts?.method === "DELETE")
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve(mockSimilarGames),
    });
  }) as unknown as typeof fetch;
}

describe("useAdminSimilarGames", () => {
  beforeEach(() => {
    globalThis.fetch = successFetch();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches on mount with gameId", async () => {
    const wrapper = createSWRWrapper();
    const { result } = renderHook(() => useAdminSimilarGames("game1"), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.similarGames).toEqual(mockSimilarGames);
    expect(result.current.error).toBeNull();
  });

  it("handles fetch error", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ error: "Server error" }),
      })
    ) as unknown as typeof fetch;
    const wrapper = createSWRWrapper();
    const { result } = renderHook(() => useAdminSimilarGames("game1"), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
  });

  it("removes a similar game", async () => {
    const wrapper = createSWRWrapper();
    const { result } = renderHook(() => useAdminSimilarGames("game1"), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.removeSimilarGame("sg1");
    });
    expect(success).toBe(true);
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const del = calls.filter(
      (c) => (c as unknown[])[1] && ((c as unknown[])[1] as RequestInit).method === "DELETE"
    );
    expect(del.length).toBe(1);
    expect((del[0] as unknown[])[0]).toContain("/api/admin/games/game1/similar-games?entryId=sg1");
  });

  it("adds a similar game", async () => {
    const wrapper = createSWRWrapper();
    const { result } = renderHook(() => useAdminSimilarGames("game1"), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    let res: { ok: boolean } | undefined;
    await act(async () => {
      res = await result.current.addSimilarGame("zelda");
    });
    expect(res?.ok).toBe(true);
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const post = calls.filter(
      (c) => (c as unknown[])[1] && ((c as unknown[])[1] as RequestInit).method === "POST"
    );
    expect(post.length).toBe(1);
    expect((post[0] as unknown[])[0]).toContain("/api/admin/games/game1/similar-games");
  });
});
