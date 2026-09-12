import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCharacterOverrides } from "@/hooks/useCharacterOverrides";

const originalFetch = globalThis.fetch;

const mockOverrides = [
  {
    id: "o1",
    character_id: "c1",
    field_name: "name",
    overridden_by: "user1",
    overridden_at: "2025-01-01",
  },
  {
    id: "o2",
    character_id: "c1",
    field_name: "description",
    overridden_by: null,
    overridden_at: "2025-01-02",
  },
];

function jsonOk(body: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
}

describe("useCharacterOverrides", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn(() => jsonOk({ overrides: mockOverrides }));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("when igdbId is null, isIgdbField always returns false", () => {
    const { result } = renderHook(() => useCharacterOverrides("c1", null));

    expect(result.current.isIgdbField("name" as never)).toBe(false);
    expect(result.current.isIgdbField("description" as never)).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("when igdbId is undefined, isIgdbField always returns false", () => {
    const { result } = renderHook(() => useCharacterOverrides("c1", undefined));

    expect(result.current.isIgdbField("name" as never)).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches overrides when igdbId exists", async () => {
    const { result } = renderHook(() => useCharacterOverrides("c1", 12345));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith("/api/admin/characters/c1/overrides");
  });

  it("isIgdbField returns true for non-overridden fields", async () => {
    const { result } = renderHook(() => useCharacterOverrides("c1", 12345));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // "bio" is not in the overrides list → still IGDB data
    expect(result.current.isIgdbField("bio" as never)).toBe(true);
  });

  it("isIgdbField returns false for overridden fields", async () => {
    const { result } = renderHook(() => useCharacterOverrides("c1", 12345));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // "name" and "description" are in the overrides list → manually overridden
    expect(result.current.isIgdbField("name" as never)).toBe(false);
    expect(result.current.isIgdbField("description" as never)).toBe(false);
  });

  it("does not fetch when characterId is undefined", () => {
    const { result } = renderHook(() => useCharacterOverrides(undefined, 12345));

    expect(result.current.loading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
