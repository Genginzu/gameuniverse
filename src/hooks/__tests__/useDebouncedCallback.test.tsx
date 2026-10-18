import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

describe("useDebouncedCallback", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("invokes the callback once with the last arguments after the delay", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current("a");
      result.current("ab");
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("ab");
  });

  it("drops the pending call on unmount", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => result.current("x"));
    unmount();
    act(() => vi.advanceTimersByTime(300));

    expect(callback).not.toHaveBeenCalled();
  });
});
