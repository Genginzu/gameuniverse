import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { LoadingButton } from "../../../../src/components/ui/loading-button";

describe("LoadingButton component rendering", () => {
  describe("basic rendering", () => {
    it("should render a button element", () => {
      const html = renderToString(<LoadingButton>Click me</LoadingButton>);
      expect(html).toContain("<button");
      expect(html).toContain("</button>");
      expect(html).toContain("Click me");
    });

    it("should apply button default classes", () => {
      const html = renderToString(<LoadingButton>Submit</LoadingButton>);
      expect(html).toContain("inline-flex");
      expect(html).toContain("items-center");
      expect(html).toContain("justify-center");
    });
  });

  describe("loading prop", () => {
    it("should not show spinner when loading is false (default)", () => {
      const html = renderToString(<LoadingButton>Submit</LoadingButton>);
      // LoadingSpinner renders with animate-spin
      expect(html).not.toContain("animate-spin");
    });

    it("should show spinner when loading is true", () => {
      const html = renderToString(<LoadingButton loading={true}>Submit</LoadingButton>);
      // LoadingSpinner renders with animate-spin
      expect(html).toContain("animate-spin");
    });

    it("should disable button when loading is true", () => {
      const html = renderToString(<LoadingButton loading={true}>Submit</LoadingButton>);
      expect(html).toContain("disabled");
    });

    it("should not have disabled attribute when loading is false", () => {
      const html = renderToString(<LoadingButton loading={false}>Submit</LoadingButton>);
      // Button should not have disabled="" attribute (but may have "disabled" in class names)
      expect(html).not.toContain('disabled=""');
    });
  });

  describe("loadingText prop", () => {
    it("should show children when not loading", () => {
      const html = renderToString(
        <LoadingButton loadingText="Submitting...">Submit</LoadingButton>
      );
      expect(html).toContain("Submit");
      expect(html).not.toContain("Submitting...");
    });

    it("should show loadingText when loading", () => {
      const html = renderToString(
        <LoadingButton loading={true} loadingText="Submitting...">
          Submit
        </LoadingButton>
      );
      expect(html).toContain("Submitting...");
    });

    it("should show children when loading but no loadingText provided", () => {
      const html = renderToString(<LoadingButton loading={true}>Submit</LoadingButton>);
      expect(html).toContain("Submit");
    });
  });

  describe("disabled prop", () => {
    it("should be disabled when disabled prop is true", () => {
      const html = renderToString(<LoadingButton disabled={true}>Submit</LoadingButton>);
      expect(html).toContain("disabled");
    });

    it("should be disabled when loading is true even if disabled is false", () => {
      const html = renderToString(
        <LoadingButton loading={true} disabled={false}>
          Submit
        </LoadingButton>
      );
      expect(html).toContain("disabled");
    });

    it("should not have disabled attribute when both loading and disabled are false", () => {
      const html = renderToString(
        <LoadingButton loading={false} disabled={false}>
          Submit
        </LoadingButton>
      );
      // Button should not have disabled="" attribute (but may have "disabled" in class names)
      expect(html).not.toContain('disabled=""');
    });
  });

  describe("button variants", () => {
    it("should support default variant", () => {
      const html = renderToString(<LoadingButton variant="default">Default</LoadingButton>);
      expect(html).toContain("bg-primary");
    });

    it("should support destructive variant", () => {
      const html = renderToString(<LoadingButton variant="destructive">Delete</LoadingButton>);
      expect(html).toContain("bg-destructive");
    });

    it("should support outline variant", () => {
      const html = renderToString(<LoadingButton variant="outline">Outline</LoadingButton>);
      expect(html).toContain("border");
      expect(html).toContain("bg-background");
    });

    it("should support secondary variant", () => {
      const html = renderToString(<LoadingButton variant="secondary">Secondary</LoadingButton>);
      expect(html).toContain("bg-secondary");
    });

    it("should support ghost variant", () => {
      const html = renderToString(<LoadingButton variant="ghost">Ghost</LoadingButton>);
      expect(html).toContain("hover:bg-accent");
    });

    it("should support link variant", () => {
      const html = renderToString(<LoadingButton variant="link">Link</LoadingButton>);
      expect(html).toContain("text-primary");
      expect(html).toContain("underline-offset-4");
    });
  });

  describe("button sizes", () => {
    it("should support default size", () => {
      const html = renderToString(<LoadingButton size="default">Default</LoadingButton>);
      expect(html).toContain("h-10");
      expect(html).toContain("px-4");
    });

    it("should support sm size", () => {
      const html = renderToString(<LoadingButton size="sm">Small</LoadingButton>);
      expect(html).toContain("h-9");
      expect(html).toContain("px-3");
    });

    it("should support lg size", () => {
      const html = renderToString(<LoadingButton size="lg">Large</LoadingButton>);
      expect(html).toContain("h-12");
      expect(html).toContain("px-8");
    });

    it("should support icon size", () => {
      const html = renderToString(<LoadingButton size="icon">🔍</LoadingButton>);
      expect(html).toContain("h-10");
      expect(html).toContain("w-10");
    });
  });

  describe("HTML attributes", () => {
    it("should pass through type attribute", () => {
      const html = renderToString(<LoadingButton type="submit">Submit</LoadingButton>);
      expect(html).toContain('type="submit"');
    });

    it("should pass through name attribute", () => {
      const html = renderToString(<LoadingButton name="submit-btn">Submit</LoadingButton>);
      expect(html).toContain('name="submit-btn"');
    });

    it("should pass through data-testid", () => {
      const html = renderToString(<LoadingButton data-testid="loading-btn">Submit</LoadingButton>);
      expect(html).toContain('data-testid="loading-btn"');
    });
  });

  describe("className prop", () => {
    it("should merge custom className", () => {
      const html = renderToString(<LoadingButton className="my-button">Submit</LoadingButton>);
      expect(html).toContain("my-button");
      expect(html).toContain("inline-flex");
    });
  });

  describe("combined props", () => {
    it("should handle loading with variant and size", () => {
      const html = renderToString(
        <LoadingButton loading={true} variant="destructive" size="lg" loadingText="Deleting...">
          Delete
        </LoadingButton>
      );
      expect(html).toContain("animate-spin");
      expect(html).toContain("bg-destructive");
      expect(html).toContain("h-12");
      expect(html).toContain("Deleting...");
      expect(html).toContain('disabled=""');
    });
  });
});
