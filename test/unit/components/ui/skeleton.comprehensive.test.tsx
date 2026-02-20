import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { Skeleton } from "../../../../src/components/ui/skeleton";

describe("Skeleton component rendering", () => {
  describe("basic rendering", () => {
    it("should render a div element", () => {
      const html = renderToString(<Skeleton />);
      expect(html).toContain("<div");
      expect(html).toContain("</div>");
    });

    it("should apply default classes", () => {
      const html = renderToString(<Skeleton />);
      expect(html).toContain("animate-pulse");
      expect(html).toContain("rounded-md");
      expect(html).toContain("bg-muted");
    });
  });

  describe("className prop", () => {
    it("should merge custom className with default classes", () => {
      const html = renderToString(<Skeleton className="h-10 w-full" />);
      expect(html).toContain("animate-pulse");
      expect(html).toContain("w-full");
      expect(html).toContain("h-10");
    });

    it("should handle multiple custom classes", () => {
      const html = renderToString(<Skeleton className="h-32 w-32 rounded-full" />);
      expect(html).toContain("w-32");
      expect(html).toContain("h-32");
      expect(html).toContain("rounded-full");
    });
  });

  describe("HTML attributes", () => {
    it("should pass through data attributes", () => {
      const html = renderToString(<Skeleton data-testid="skeleton-test" />);
      expect(html).toContain('data-testid="skeleton-test"');
    });

    it("should pass through aria attributes", () => {
      const html = renderToString(<Skeleton aria-label="Loading content" />);
      expect(html).toContain('aria-label="Loading content"');
    });

    it("should pass through id attribute", () => {
      const html = renderToString(<Skeleton id="my-skeleton" />);
      expect(html).toContain('id="my-skeleton"');
    });
  });

  describe("children", () => {
    it("should render children content", () => {
      const html = renderToString(<Skeleton>Loading...</Skeleton>);
      expect(html).toContain("Loading...");
    });
  });
});
