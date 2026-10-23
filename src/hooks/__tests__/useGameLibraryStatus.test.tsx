import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createSWRWrapper } from "@/test-helpers/swr-wrapper";
import { useGameLibraryStatus } from "@/hooks/useGameLibraryStatus";

const auth = vi.hoisted(() => ({ user: { id: "user-123" } as { id: string } | null }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: auth.user }) }));

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Stateful fake server: confirmed mutations change what the next GET returns.
function routeFetch(initialInLibrary: boolean, mutationStatus = 200) {
  let inLibrary = initialInLibrary;
  return vi.fn((_url: string, init?: RequestInit) => {
    if (init?.method === "POST" || init?.method === "DELETE") {
      if (mutationStatus < 400) inLibrary = init.method === "POST";
      return Promise.resolve(jsonResponse({}, mutationStatus));
    }
    return Promise.resolve(jsonResponse({ inLibrary }));
  });
}

function renderStatus(gameId: string) {
  return renderHook(() => useGameLibraryStatus(gameId), { wrapper: createSWRWrapper() });
}

describe("useGameLibraryStatus", () => {
  let mockFetch: ReturnType<typeof routeFetch>;

  beforeEach(() => {
    auth.user = { id: "user-123" };
    mockFetch = routeFetch(false);
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("reads the library status of the game", async () => {
    mockFetch = routeFetch(true);
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    const { result } = renderStatus("game-789");

    await waitFor(() => expect(result.current.inLibrary).toBe(true));
    expect(mockFetch).toHaveBeenCalledWith("/api/library/game-789");
  });

  it.each([
    ["no game id", "", { id: "user-123" }],
    ["no user", "game-1", null],
  ])("does nothing with %s", async (_label, gameId, user) => {
    auth.user = user;
    const { result } = renderStatus(gameId);

    let added: boolean | undefined;
    let removed: boolean | undefined;
    await act(async () => {
      added = await result.current.addToLibrary();
      removed = await result.current.removeFromLibrary();
    });

    expect(added).toBe(false);
    expect(removed).toBe(false);
    expect(result.current.inLibrary).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("adds the game through POST /api/library and reports success", async () => {
    const { result } = renderStatus("game-123");
    await waitFor(() => expect(result.current.loading).toBe(false));

    let added: boolean | undefined;
    await act(async () => {
      added = await result.current.addToLibrary();
    });

    expect(added).toBe(true);
    expect(result.current.inLibrary).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: "game-123" }),
    });
  });

  it("removes the game through DELETE /api/library/:id and reports success", async () => {
    mockFetch = routeFetch(true);
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    const { result } = renderStatus("game-456");
    await waitFor(() => expect(result.current.inLibrary).toBe(true));

    let removed: boolean | undefined;
    await act(async () => {
      removed = await result.current.removeFromLibrary();
    });

    expect(removed).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith("/api/library/game-456", { method: "DELETE" });
  });

  it("reports failure and keeps the previous status when the server refuses", async () => {
    mockFetch = routeFetch(false, 500);
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    const { result } = renderStatus("game-123");
    await waitFor(() => expect(result.current.loading).toBe(false));

    let added: boolean | undefined;
    await act(async () => {
      added = await result.current.addToLibrary();
    });

    expect(added).toBe(false);
    expect(result.current.inLibrary).toBe(false);
  });
});
