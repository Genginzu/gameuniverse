import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderToString } from "react-dom/server";

// Mock state for useImageLoading
let mockImageLoadingState = {
  isLoading: false,
  hasError: false,
  imageSrc: "https://example.com/image.jpg",
};

// Mock useImageLoading hook
vi.mock("../../../../src/hooks/useImageLoading", () => ({
  useImageLoading: () => mockImageLoadingState,
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
    fill,
    width,
    height,
    priority,
    sizes,
    onLoad,
    onError,
  }: {
    src: string;
    alt: string;
    className?: string;
    fill?: boolean;
    width?: number;
    height?: number;
    priority?: boolean;
    sizes?: string;
    onLoad?: () => void;
    onError?: () => void;
  }) => {
    const props: Record<string, unknown> = {
      src,
      alt,
      className,
      "data-fill": fill,
      "data-priority": priority,
      "data-sizes": sizes,
    };
    if (width) props.width = width;
    if (height) props.height = height;
    return <img {...props} />;
  },
}));

// Mock Skeleton component
vi.mock("../../../../src/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Import component after mocks
import { LazyImage } from "../../../../src/components/ui/lazy-image";

describe("LazyImage integration tests", () => {
  beforeEach(() => {
    mockImageLoadingState = {
      isLoading: false,
      hasError: false,
      imageSrc: "https://example.com/image.jpg",
    };
  });

  describe("rendering states", () => {
    it("should render skeleton when loading", () => {
      mockImageLoadingState = { isLoading: true, hasError: false, imageSrc: undefined };

      const html = renderToString(
        <LazyImage src="https://example.com/image.jpg" alt="Test image" />
      );

      expect(html).toContain("skeleton");
    });

    it("should not render skeleton when showSkeleton is false", () => {
      mockImageLoadingState = { isLoading: true, hasError: false, imageSrc: undefined };

      const html = renderToString(
        <LazyImage src="https://example.com/image.jpg" alt="Test image" showSkeleton={false} />
      );

      // showSkeleton=false means no skeleton rendered, but image still renders
      expect(html).not.toContain("skeleton");
      expect(html).toContain("img");
    });

    it("should render placeholder when no imageSrc and no fallback", () => {
      mockImageLoadingState = { isLoading: false, hasError: true, imageSrc: undefined };

      const html = renderToString(<LazyImage src="" alt="Test image" fallbackSrc="" />);

      expect(html).toContain("svg");
      expect(html).toContain("bg-gray-100");
    });

    it("should render image when loaded", () => {
      mockImageLoadingState = {
        isLoading: false,
        hasError: false,
        imageSrc: "https://example.com/loaded.jpg",
      };

      const html = renderToString(
        <LazyImage src="https://example.com/loaded.jpg" alt="Test image" />
      );

      expect(html).toContain("img");
      expect(html).toContain("https://example.com/loaded.jpg");
      expect(html).toContain("Test image");
    });
  });

  describe("props handling", () => {
    it("should pass width and height to Image", () => {
      mockImageLoadingState = {
        isLoading: false,
        hasError: false,
        imageSrc: "https://example.com/image.jpg",
      };

      const html = renderToString(
        <LazyImage src="https://example.com/image.jpg" alt="Test" width={200} height={150} />
      );

      expect(html).toContain('width="200"');
      expect(html).toContain('height="150"');
    });

    it("should handle fill prop", () => {
      mockImageLoadingState = {
        isLoading: false,
        hasError: false,
        imageSrc: "https://example.com/image.jpg",
      };

      const html = renderToString(
        <LazyImage src="https://example.com/image.jpg" alt="Test" fill />
      );

      expect(html).toContain("relative h-full w-full");
    });

    it("should apply custom className", () => {
      mockImageLoadingState = {
        isLoading: false,
        hasError: false,
        imageSrc: "https://example.com/image.jpg",
      };

      const html = renderToString(
        <LazyImage src="https://example.com/image.jpg" alt="Test" className="custom-class" />
      );

      expect(html).toContain("custom-class");
    });

    it("should handle priority prop", () => {
      mockImageLoadingState = {
        isLoading: false,
        hasError: false,
        imageSrc: "https://example.com/image.jpg",
      };

      const html = renderToString(
        <LazyImage src="https://example.com/image.jpg" alt="Test" priority />
      );

      expect(html).toContain('data-priority="true"');
    });

    it("should handle sizes prop", () => {
      mockImageLoadingState = {
        isLoading: false,
        hasError: false,
        imageSrc: "https://example.com/image.jpg",
      };

      const html = renderToString(
        <LazyImage
          src="https://example.com/image.jpg"
          alt="Test"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      );

      expect(html).toContain("(max-width: 768px) 100vw, 50vw");
    });
  });

  describe("skeleton with fill", () => {
    it("should add absolute inset-0 to skeleton when fill is true", () => {
      mockImageLoadingState = { isLoading: true, hasError: false, imageSrc: undefined };

      const html = renderToString(
        <LazyImage src="https://example.com/image.jpg" alt="Test" fill />
      );

      expect(html).toContain("absolute inset-0");
    });
  });

  describe("image opacity transition", () => {
    it("should have opacity-0 class when not loaded", () => {
      mockImageLoadingState = {
        isLoading: false,
        hasError: false,
        imageSrc: "https://example.com/image.jpg",
      };

      // Initial render - imageLoaded is false
      const html = renderToString(<LazyImage src="https://example.com/image.jpg" alt="Test" />);

      expect(html).toContain("opacity-0");
      expect(html).toContain("transition-opacity");
    });
  });
});
