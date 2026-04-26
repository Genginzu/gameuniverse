import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createSWRWrapper } from "../../helpers/swr-wrapper";
import { useCharacters } from "@/hooks/useCharacters";

const originalFetch = globalThis.fetch;

const mockResponse = {
  characters: [{ id: "c1", name: "Mario", slug: "mario" }],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("useCharacters", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn(() => Promise.resolve(jsonResponse(mockResponse)));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches /api/characters with correct params", async () => {
    const { result } = renderHook(() => useCharacters({ locale: "fr", page: 1, limit: 20 }), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith("/api/characters?locale=fr&page=1&limit=20");
  });

  it("returns characters array after fetch", async () => {
    const { result } = renderHook(() => useCharacters({ locale: "fr", page: 1, limit: 20 }), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.characters).toEqual(mockResponse.characters);
    expect(result.current.pagination).toEqual(mockResponse.pagination);
  });

  it("returns null key when no locale (no fetch)", () => {
    const { result } = renderHook(() => useCharacters({ locale: "", page: 1, limit: 20 }), {
      wrapper: createSWRWrapper(),
    });

    expect(result.current.characters).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
