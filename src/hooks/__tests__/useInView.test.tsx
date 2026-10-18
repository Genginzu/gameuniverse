import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInView } from "@/hooks/useInView";

let observerCallback: (entries: Array<{ isIntersecting: boolean }>) => void;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.IntersectionObserver = class MockIntersectionObserver {
    constructor(cb: any) {
      observerCallback = cb;
    }
    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = mockUnobserve;
    root = null;
    rootMargin = "";
    thresholds = [];
    takeRecords = () => [];
  } as unknown as typeof IntersectionObserver;
});

function createMockRef() {
  const el = document.createElement("div");
  return { current: el };
}

describe("useInView", () => {
  it("returns false initially", () => {
    const ref = createMockRef();
    const { result } = renderHook(() => useInView(ref));
    expect(result.current).toBe(false);
    expect(mockObserve).toHaveBeenCalled();
  });

  it("returns true when element intersects", () => {
    const ref = createMockRef();
    const { result } = renderHook(() => useInView(ref));

    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(result.current).toBe(true);
  });

  it("unobserves when once=true after intersection", () => {
    const ref = createMockRef();
    renderHook(() => useInView(ref, { once: true }));

    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(mockUnobserve).toHaveBeenCalledWith(ref.current);
  });
});
