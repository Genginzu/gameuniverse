import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCharacterSync } from "@/hooks/useCharacterSync";

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

function jsonError(body: unknown) {
  return Promise.resolve({ ok: false, json: () => Promise.resolve(body) });
}

describe("useCharacterSync", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn(() => jsonOk({ overrides: mockOverrides }));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches overrides on mount", async () => {
    const { result } = renderHook(() => useCharacterSync("c1"));

    await waitFor(() => expect(result.current.loadingOverrides).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith("/api/admin/characters/c1/overrides");
    expect(result.current.overrides).toHaveLength(2);
    expect(result.current.overrides[0].fieldName).toBe("name");
    expect(result.current.overrides[0].characterId).toBe("c1");
  });

  it("syncField POSTs with field name", async () => {
    const { result } = renderHook(() => useCharacterSync("c1"));
    await waitFor(() => expect(result.current.loadingOverrides).toBe(false));

    await act(async () => {
      const success = await result.current.syncField("name" as never);
      expect(success).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/admin/characters/c1/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field: "name" }),
    });
  });

  it("syncAll POSTs with empty body", async () => {
    const { result } = renderHook(() => useCharacterSync("c1"));
    await waitFor(() => expect(result.current.loadingOverrides).toBe(false));

    await act(async () => {
      const success = await result.current.syncAll();
      expect(success).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/admin/characters/c1/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  });

  it("handles sync error", async () => {
    const { result } = renderHook(() => useCharacterSync("c1"));
    await waitFor(() => expect(result.current.loadingOverrides).toBe(false));

    mockFetch.mockImplementation((url: string) =>
      url.includes("/sync") ? jsonError({ error: "Conflict" }) : jsonOk({ overrides: [] })
    );

    await act(async () => {
      const success = await result.current.syncField("name" as never);
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe("Conflict");
  });

  it("returns empty when no characterId", () => {
    const { result } = renderHook(() => useCharacterSync(undefined));

    expect(result.current.overrides).toEqual([]);
    expect(result.current.loadingOverrides).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
