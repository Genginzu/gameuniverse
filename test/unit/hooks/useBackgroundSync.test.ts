import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

describe("useBackgroundSync", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it("does not fire sync when igdbId is undefined", () => {
    renderHook(() => useBackgroundSync("test-slug", undefined, undefined));
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("does not fire sync when lastSyncedAt is recent", () => {
    const recentDate = new Date().toISOString();
    renderHook(() => useBackgroundSync("test-slug", 123, recentDate));
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("fires POST when conditions are met", () => {
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    renderHook(() => useBackgroundSync("test-slug", 123, oldDate));
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/games/test-slug/sync", { method: "POST" });
  });

  it("fires when lastSyncedAt is undefined", () => {
    renderHook(() => useBackgroundSync("test-slug", 123, undefined));
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/games/test-slug/sync", { method: "POST" });
  });

  it("only fires once across re-renders", () => {
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const { rerender } = renderHook(() => useBackgroundSync("test-slug", 123, oldDate));
    rerender();
    rerender();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
