import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePlayerPlaytime } from "@/hooks/usePlayerPlaytime";
import { createSWRWrapper } from "../../helpers/swr-wrapper";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: null, loading: false }),
}));

const mockStats = {
  averages: { hastily: 10, normally: 20, completely: 30 },
  count: 3,
  userPlaytime: null,
  contributors: [],
};

describe("usePlayerPlaytime", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStats),
      headers: new Headers({ "content-type": "application/json" }),
    });
  });

  it("returns loading initially", () => {
    const { result } = renderHook(() => usePlayerPlaytime("test-slug"), {
      wrapper: createSWRWrapper(),
    });
    expect(result.current.loading).toBe(true);
  });

  it("returns playtime data after fetch", async () => {
    const { result } = renderHook(() => usePlayerPlaytime("test-slug"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.error).toBeNull();
  });

  it("handles fetch error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const { result } = renderHook(() => usePlayerPlaytime("test-slug"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
  });
});
