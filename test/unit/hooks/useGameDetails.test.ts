import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createSWRWrapper } from "../../helpers/swr-wrapper";
import { useGameDetails } from "@/hooks/useGameDetails";

const originalFetch = globalThis.fetch;

const mockGame = { id: "1", slug: "test-game", name: "Test Game" };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("useGameDetails", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn(() => Promise.resolve(jsonResponse(mockGame)));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns loading true initially", () => {
    const { result } = renderHook(() => useGameDetails("test-game"), {
      wrapper: createSWRWrapper(),
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.game).toBeNull();
  });

  it("returns game data after fetch resolves", async () => {
    const { result } = renderHook(() => useGameDetails("test-game"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.game).toEqual(mockGame);
    expect(result.current.error).toBeNull();
  });

  it("returns null game when slug is empty", async () => {
    const { result } = renderHook(() => useGameDetails(""), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.game).toBeNull();
  });

  it("returns error message on fetch failure", async () => {
    mockFetch.mockImplementation(() => Promise.resolve(jsonResponse({ error: "Not found" }, 404)));

    const { result } = renderHook(() => useGameDetails("bad-slug"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.game).toBeNull();
  });
});
