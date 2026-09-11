import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMentionAutocomplete } from "@/hooks/useMentionAutocomplete";

describe("useMentionAutocomplete", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ players: [{ id: "p1", username: "john" }] }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("no mention query when content has no @, isOpen is false", () => {
    const { result } = renderHook(() => useMentionAutocomplete("hello world", 11));
    expect(result.current.isOpen).toBe(false);
    expect(result.current.mentionQuery).toBeNull();
    expect(result.current.suggestions).toEqual([]);
  });

  it("detects @mention query when content='hello @joh' and cursor=10", async () => {
    const { result } = renderHook(() => useMentionAutocomplete("hello @joh", 10));

    expect(result.current.mentionQuery).toBe("joh");
    expect(result.current.isOpen).toBe(true);

    // Advance past debounce (250ms in the hook)
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/players/search?q=joh"),
      expect.anything()
    );
  });

  it("isOpen false when query < 2 chars", () => {
    const { result } = renderHook(() => useMentionAutocomplete("hello @j", 8));
    expect(result.current.mentionQuery).toBe("j");
    expect(result.current.isOpen).toBe(false);
  });
});
