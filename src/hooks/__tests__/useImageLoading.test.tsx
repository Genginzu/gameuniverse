import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useImageLoading } from "../useImageLoading";

/** Image stub that records every instance so tests can fire load/error events. */
class FakeImage {
  static instances: FakeImage[] = [];
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = "";

  constructor() {
    FakeImage.instances.push(this);
  }
}

const lastImage = () => FakeImage.instances[FakeImage.instances.length - 1];

describe("useImageLoading", () => {
  beforeEach(() => {
    FakeImage.instances = [];
    vi.stubGlobal("Image", FakeImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts loading the source image", () => {
    const { result } = renderHook(() => useImageLoading({ src: "/a.jpg" }));
    expect(result.current).toEqual({ isLoading: true, hasError: false, imageSrc: "/a.jpg" });
    expect(lastImage().src).toBe("/a.jpg");
  });

  it("exposes the source once it has loaded", () => {
    const { result } = renderHook(() => useImageLoading({ src: "/a.jpg", fallbackSrc: "/f.jpg" }));
    act(() => lastImage().onload?.());
    expect(result.current).toEqual({ isLoading: false, hasError: false, imageSrc: "/a.jpg" });
  });

  it("switches to the fallback when the image fails", () => {
    const { result } = renderHook(() => useImageLoading({ src: "/a.jpg", fallbackSrc: "/f.jpg" }));
    act(() => lastImage().onerror?.());
    expect(result.current).toEqual({ isLoading: false, hasError: true, imageSrc: "/f.jpg" });
  });

  it("exposes no image when it fails without a fallback", () => {
    const { result } = renderHook(() => useImageLoading({ src: "/a.jpg" }));
    act(() => lastImage().onerror?.());
    expect(result.current.imageSrc).toBeUndefined();
    expect(result.current.hasError).toBe(true);
  });

  it("uses the fallback immediately when no source is given", () => {
    const { result } = renderHook(() => useImageLoading({ fallbackSrc: "/f.jpg" }));
    expect(result.current).toEqual({ isLoading: false, hasError: true, imageSrc: "/f.jpg" });
    expect(FakeImage.instances).toHaveLength(0);
  });

  it("restarts loading and detaches the old image when the source changes", () => {
    const { result, rerender } = renderHook(({ src }) => useImageLoading({ src }), {
      initialProps: { src: "/a.jpg" },
    });
    const first = lastImage();
    act(() => first.onerror?.());
    expect(result.current.hasError).toBe(true);

    rerender({ src: "/b.jpg" });

    expect(first.onload).toBeNull();
    expect(first.onerror).toBeNull();
    expect(result.current).toMatchObject({ isLoading: true, hasError: false });
    expect(lastImage()).not.toBe(first);
    expect(lastImage().src).toBe("/b.jpg");
  });

  it("detaches handlers on unmount", () => {
    const { unmount } = renderHook(() => useImageLoading({ src: "/a.jpg" }));
    const image = lastImage();
    unmount();
    expect(image.onload).toBeNull();
    expect(image.onerror).toBeNull();
  });
});
