import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { usePlatforms } from "@/hooks/usePlatforms";
import { createSWRWrapper } from "@/test-helpers/swr-wrapper";

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("usePlatforms", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn((url: string) => {
      if (url.startsWith("/api/genres"))
        return Promise.resolve(jsonResponse({ genres: [{ id: "g", name: "RPG", slug: "rpg" }] }));
      if (url.startsWith("/api/platforms"))
        return Promise.resolve(jsonResponse({ platforms: [{ id: "p", name: "PC", slug: "pc" }] }));
      return Promise.resolve(jsonResponse({ games: ["LoL", "CS2"] }));
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("usePlatforms loads the localized platforms", async () => {
    const { result } = renderHook(() => usePlatforms("en"), { wrapper: createSWRWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.platforms).toEqual([{ id: "p", name: "PC", slug: "pc" }]);
    expect(mockFetch.mock.calls[0][0]).toBe("/api/platforms?locale=en");
  });
});
