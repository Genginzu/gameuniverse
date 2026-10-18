import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createSWRWrapper } from "@/test-helpers/swr-wrapper";
import { useUserLibrary } from "../useUserLibrary";

const auth = vi.hoisted(() => ({ user: null as { id: string } | null }));
vi.mock("../useAuth", () => ({ useAuth: () => ({ user: auth.user }) }));

const GAME = {
  id: "game-1",
  slug: "zelda",
  title: "Zelda",
  genres: [],
  developer: "",
  publisher: "",
};
const STATS = { totalGames: 10, ownedGames: 8, completedGames: 3, totalPlayTime: 150 };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const fetchMock = vi.fn<typeof fetch>();

function routeFetch(overrides: Record<string, () => Response> = {}) {
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input);
    const key = `${init?.method ?? "GET"} ${url}`;
    if (overrides[key]) return overrides[key]();
    if (url === "/api/library") return jsonResponse({ games: [GAME] });
    if (url === "/api/library/stats") return jsonResponse(STATS);
    return jsonResponse({}, 404);
  });
}

function renderLibrary() {
  return renderHook(() => useUserLibrary(), { wrapper: createSWRWrapper() });
}

describe("useUserLibrary", () => {
  beforeEach(() => {
    auth.user = { id: "user-1" };
    fetchMock.mockReset();
    routeFetch();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not fetch and returns empty defaults for anonymous visitors", async () => {
    auth.user = null;
    const { result } = renderLibrary();

    expect(result.current.games).toEqual([]);
    expect(result.current.stats).toEqual({
      totalGames: 0,
      ownedGames: 0,
      completedGames: 0,
      totalPlayTime: 0,
    });
    expect(await result.current.addToLibrary("game-1")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads games and stats from their separate endpoints", async () => {
    const { result } = renderLibrary();

    await waitFor(() => expect(result.current.games).toEqual([GAME]));
    await waitFor(() => expect(result.current.stats).toEqual(STATS));
    expect(result.current.error).toBeNull();
  });

  it("exposes the fetch error message", async () => {
    routeFetch({ "GET /api/library": () => jsonResponse({ error: "boom" }, 500) });
    const { result } = renderLibrary();

    await waitFor(() => expect(result.current.error).toBe("boom"));
    expect(result.current.games).toEqual([]);
  });

  it("adds a game with the default owned status and revalidates", async () => {
    routeFetch({ "POST /api/library": () => jsonResponse({ success: true }) });
    const { result } = renderLibrary();
    await waitFor(() => expect(result.current.games).toHaveLength(1));
    fetchMock.mockClear();

    let added = false;
    await act(async () => {
      added = await result.current.addToLibrary("game-2");
    });

    expect(added).toBe(true);
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(post?.[0]).toBe("/api/library");
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ gameId: "game-2", status: "owned" });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(
      expect.arrayContaining(["/api/library", "/api/library/stats"])
    );
  });

  it("returns false when adding fails", async () => {
    routeFetch({ "POST /api/library": () => jsonResponse({ error: "already" }, 409) });
    const { result } = renderLibrary();

    let added = true;
    await act(async () => {
      added = await result.current.addToLibrary("game-1", "wishlist");
    });
    expect(added).toBe(false);
  });

  it("removes a game through DELETE /api/library/:id", async () => {
    routeFetch({ "DELETE /api/library/game-1": () => jsonResponse({ success: true }) });
    const { result } = renderLibrary();

    let removed = false;
    await act(async () => {
      removed = await result.current.removeFromLibrary("game-1");
    });

    expect(removed).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("/api/library/game-1", { method: "DELETE" });
  });

  it("returns false when removal fails", async () => {
    routeFetch({ "DELETE /api/library/game-1": () => jsonResponse({}, 500) });
    const { result } = renderLibrary();

    let removed = true;
    await act(async () => {
      removed = await result.current.removeFromLibrary("game-1");
    });
    expect(removed).toBe(false);
  });

  it.each([
    [{ inLibrary: true }, 200, true],
    [{ inLibrary: false }, 200, false],
    [{}, 404, false],
  ])("isInLibrary resolves %o (HTTP %i) to %s", async (body, status, expected) => {
    routeFetch({ "GET /api/library/game-1": () => jsonResponse(body, status) });
    const { result } = renderLibrary();
    expect(await result.current.isInLibrary("game-1")).toBe(expected);
  });
});
