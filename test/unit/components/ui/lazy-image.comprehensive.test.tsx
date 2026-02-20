import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";

// Configurable mock state — tests change these values before rendering
const mockState = {
  isLoading: false,
  hasError: false,
  imageSrc: "/test-image.jpg" as string | undefined,
};

vi.mock("../../../../src/hooks/useImageLoading", () => ({
  useImageLoading: () => ({
    isLoading: mockState.isLoading,
    hasError: mockState.hasError,
    imageSrc: mockState.imageSrc,
  }),
}));

// Import after mocking
import { LazyImage } from "../../../../src/components/ui/lazy-image";

describe("LazyImage component rendering", () => {
  beforeEach(() => {
    // Reset to default "loaded" state
    mockState.isLoading = false;
    mockState.hasError = false;
    mockState.imageSrc = "/test-image.jpg";
  });

  describe("component export", () => {
    it("should export LazyImage component", () => {
      expect(LazyImage).toBeDefined();
    });

    it("should be a function component", () => {
      expect(typeof LazyImage).toBe("function");
    });
  });

  describe("image loaded state", () => {
    it("should render Image component when imageSrc is available", () => {
      const html = renderToString(
        <LazyImage src="/test-image.jpg" alt="Test image" width={200} height={150} />
      );
      expect(html).toContain("<img");
      expect(html).toContain('alt="Test image"');
    });

    it("should apply className to image", () => {
      const html = renderToString(
        <LazyImage src="/test.jpg" alt="Test" className="custom-class" width={100} height={100} />
      );
      expect(html).toContain("custom-class");
    });
  });

  describe("fill prop", () => {
    it("should render with fill container classes when fill is true", () => {
      const html = renderToString(<LazyImage src="/test.jpg" alt="Test" fill={true} />);
      expect(html).toContain("relative");
      expect(html).toContain("h-full");
      expect(html).toContain("w-full");
    });

    it("should render without fill container when fill is false", () => {
      const html = renderToString(
        <LazyImage src="/test.jpg" alt="Test" width={100} height={100} />
      );
      expect(html).toContain("relative");
    });
  });

  describe("alt prop", () => {
    it("should pass alt prop to image", () => {
      const html = renderToString(
        <LazyImage src="/test.jpg" alt="My alt text" width={100} height={100} />
      );
      expect(html).toContain('alt="My alt text"');
    });
  });
});

describe("LazyImage loading state", () => {
  it("should render skeleton when loading and showSkeleton is true", () => {
    mockState.isLoading = true;
    mockState.hasError = false;
    mockState.imageSrc = undefined;

    const html = renderToString(<LazyImage src="/test.jpg" alt="Test" showSkeleton={true} />);
    expect(html).toContain("animate-pulse");
  });
});

describe("LazyImage no image state", () => {
  it("should render placeholder when imageSrc is undefined", () => {
    mockState.isLoading = false;
    mockState.hasError = true;
    mockState.imageSrc = undefined;

    const html = renderToString(<LazyImage src="" alt="Test" />);
    expect(html).toContain("<svg");
    expect(html).toContain("bg-gray-100");
  });
});
