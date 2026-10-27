import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { AppImage } from "@/components/ui/app-image";
import { igdbImageLoader, unsplashImageLoader } from "@/lib/utils/imageLoader";

const received: ImageProps[] = [];

vi.mock("next/image", () => ({
  default: (props: ImageProps) => {
    received.push(props);
    return null;
  },
}));

function renderAndCapture(props: ImageProps): ImageProps {
  received.length = 0;
  render(<AppImage {...props} />);
  return received[0];
}

describe("AppImage", () => {
  beforeEach(() => {
    received.length = 0;
  });

  it("wires the IGDB loader for IGDB urls", () => {
    const props = renderAndCapture({
      src: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg",
      alt: "",
      width: 100,
      height: 140,
    });
    expect(props.loader).toBe(igdbImageLoader);
    expect(props.unoptimized).toBeUndefined();
  });

  it("wires the Unsplash loader for Unsplash urls", () => {
    const props = renderAndCapture({ src: "https://images.unsplash.com/p", alt: "", fill: true });
    expect(props.loader).toBe(unsplashImageLoader);
  });

  it("bypasses the optimizer for pre-sized CDNs", () => {
    const props = renderAndCapture({
      src: "https://i.ytimg.com/vi/a/hqdefault.jpg",
      alt: "",
      fill: true,
    });
    expect(props.unoptimized).toBe(true);
    expect(props.loader).toBeUndefined();
  });

  it("keeps the default optimizer for uploads and local assets", () => {
    const props = renderAndCapture({ src: "/assets/no-cover.png", alt: "", fill: true });
    expect(props.loader).toBeUndefined();
    expect(props.unoptimized).toBeUndefined();
  });

  it("respects an explicit unoptimized prop", () => {
    const props = renderAndCapture({
      src: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg",
      alt: "",
      fill: true,
      unoptimized: true,
    });
    expect(props.loader).toBeUndefined();
    expect(props.unoptimized).toBe(true);
  });
});
