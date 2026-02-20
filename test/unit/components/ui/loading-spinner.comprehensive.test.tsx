import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { LoadingSpinner } from "../../../../src/components/ui/loading-spinner";

describe("LoadingSpinner component rendering", () => {
  describe("basic rendering", () => {
    it("should render a container div", () => {
      const html = renderToString(<LoadingSpinner />);
      expect(html).toContain("<div");
      expect(html).toContain("</div>");
    });

    it("should apply flex layout classes", () => {
      const html = renderToString(<LoadingSpinner />);
      expect(html).toContain("flex");
      expect(html).toContain("flex-col");
      expect(html).toContain("items-center");
      expect(html).toContain("justify-center");
      expect(html).toContain("gap-4");
    });

    it("should render GameUniverseLogo with animate", () => {
      const html = renderToString(<LoadingSpinner />);
      // GameUniverseLogo renders with animate-spin when animate=true
      expect(html).toContain("animate-spin");
    });
  });

  describe("size prop", () => {
    it("should pass sm size to GameUniverseLogo", () => {
      const html = renderToString(<LoadingSpinner size="sm" />);
      expect(html).toContain("w-8");
      expect(html).toContain("h-8");
    });

    it("should pass md size to GameUniverseLogo by default", () => {
      const html = renderToString(<LoadingSpinner />);
      expect(html).toContain("w-12");
      expect(html).toContain("h-12");
    });

    it("should pass lg size to GameUniverseLogo", () => {
      const html = renderToString(<LoadingSpinner size="lg" />);
      expect(html).toContain("w-16");
      expect(html).toContain("h-16");
    });

    it("should pass xl size to GameUniverseLogo", () => {
      const html = renderToString(<LoadingSpinner size="xl" />);
      expect(html).toContain("w-24");
      expect(html).toContain("h-24");
    });
  });

  describe("text prop", () => {
    it("should not render text when showText is false (default)", () => {
      const html = renderToString(<LoadingSpinner text="Loading..." />);
      expect(html).not.toContain("Loading...");
    });

    it("should render text when showText is true", () => {
      const html = renderToString(<LoadingSpinner text="Loading..." showText={true} />);
      expect(html).toContain("Loading...");
      expect(html).toContain("<p");
    });

    it("should not render text element when text is undefined and showText is true", () => {
      const html = renderToString(<LoadingSpinner showText={true} />);
      // Should not have a <p> tag when text is undefined
      expect(html).not.toContain("<p");
    });
  });

  describe("showText prop", () => {
    it("should not show text by default", () => {
      const html = renderToString(<LoadingSpinner text="Please wait" />);
      expect(html).not.toContain("Please wait");
    });

    it("should show text when showText is true", () => {
      const html = renderToString(<LoadingSpinner text="Please wait" showText={true} />);
      expect(html).toContain("Please wait");
    });

    it("should not show text when showText is false", () => {
      const html = renderToString(<LoadingSpinner text="Please wait" showText={false} />);
      expect(html).not.toContain("Please wait");
    });
  });

  describe("text size based on size prop", () => {
    it("should apply text-sm for sm size", () => {
      const html = renderToString(<LoadingSpinner size="sm" text="Loading" showText={true} />);
      expect(html).toContain("text-sm");
    });

    it("should apply text-base for md size", () => {
      const html = renderToString(<LoadingSpinner size="md" text="Loading" showText={true} />);
      expect(html).toContain("text-base");
    });

    it("should apply text-lg for lg size", () => {
      const html = renderToString(<LoadingSpinner size="lg" text="Loading" showText={true} />);
      expect(html).toContain("text-lg");
    });

    it("should apply text-xl for xl size", () => {
      const html = renderToString(<LoadingSpinner size="xl" text="Loading" showText={true} />);
      expect(html).toContain("text-xl");
    });
  });

  describe("className prop", () => {
    it("should merge custom className", () => {
      const html = renderToString(<LoadingSpinner className="my-spinner" />);
      expect(html).toContain("my-spinner");
      expect(html).toContain("flex");
    });

    it("should handle multiple custom classes", () => {
      const html = renderToString(<LoadingSpinner className="mt-8 p-4" />);
      expect(html).toContain("mt-8");
      expect(html).toContain("p-4");
    });
  });

  describe("text styling", () => {
    it("should apply font-medium to text", () => {
      const html = renderToString(<LoadingSpinner text="Loading" showText={true} />);
      expect(html).toContain("font-medium");
    });

    it("should apply text-gray-600 to text", () => {
      const html = renderToString(<LoadingSpinner text="Loading" showText={true} />);
      expect(html).toContain("text-gray-600");
    });
  });
});
