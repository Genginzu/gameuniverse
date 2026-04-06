import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createSWRWrapper } from "../../helpers/swr-wrapper";
import { useCharacterFilters } from "@/hooks/useCharacterFilters";

const originalFetch = globalThis.fetch;

const mockRoles = [{ id: "r1", name: "Protagonist" }];
const mockPlatforms = [{ id: "p1", name: "PC" }];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("useCharacterFilters", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn((url: string) => {
      if (url.includes("/api/roles")) {
        return Promise.resolve(jsonResponse({ roles: mockRoles }));
      }
      if (url.includes("/api/platforms")) {
        return Promise.resolve(jsonResponse({ platforms: mockPlatforms }));
      }
      return Promise.resolve(jsonResponse({}, 404));
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns empty arrays while loading", () => {
    const { result } = renderHook(() => useCharacterFilters("fr"), {
      wrapper: createSWRWrapper(),
    });
    expect(result.current.roles).toEqual([]);
    expect(result.current.platforms).toEqual([]);
  });

  it("returns roles from /api/roles response", async () => {
    const { result } = renderHook(() => useCharacterFilters("fr"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.rolesLoading).toBe(false);
    });

    expect(result.current.roles).toEqual(mockRoles);
  });

  it("returns platforms from /api/platforms response", async () => {
    const { result } = renderHook(() => useCharacterFilters("fr"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.platformsLoading).toBe(false);
    });

    expect(result.current.platforms).toEqual(mockPlatforms);
  });
});
