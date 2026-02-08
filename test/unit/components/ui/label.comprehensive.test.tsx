import { describe, it, expect } from "bun:test";
import { renderToString } from "react-dom/server";
import { Label } from "../../../../src/components/ui/label";

describe("Label component rendering", () => {
  describe("basic rendering", () => {
    it("should render a label element", () => {
      const html = renderToString(<Label>Username</Label>);
      expect(html).toContain("<label");
      expect(html).toContain("</label>");
      expect(html).toContain("Username");
    });

    it("should apply default classes", () => {
      const html = renderToString(<Label>Test</Label>);
      expect(html).toContain("text-sm");
      expect(html).toContain("font-medium");
      expect(html).toContain("leading-none");
    });
  });

  describe("className prop", () => {
    it("should merge custom className with default classes", () => {
      const html = renderToString(<Label className="text-red-500">Error</Label>);
      expect(html).toContain("text-red-500");
      expect(html).toContain("font-medium");
    });

    it("should handle multiple custom classes", () => {
      const html = renderToString(<Label className="mb-2 text-lg">Large Label</Label>);
      expect(html).toContain("mb-2");
      expect(html).toContain("text-lg");
    });
  });

  describe("htmlFor prop", () => {
    it("should pass through htmlFor attribute", () => {
      const html = renderToString(<Label htmlFor="email-input">Email</Label>);
      expect(html).toContain('for="email-input"');
    });
  });

  describe("HTML attributes", () => {
    it("should pass through id attribute", () => {
      const html = renderToString(<Label id="my-label">Label</Label>);
      expect(html).toContain('id="my-label"');
    });

    it("should pass through data attributes", () => {
      const html = renderToString(<Label data-testid="test-label">Label</Label>);
      expect(html).toContain('data-testid="test-label"');
    });

    it("should pass through aria attributes", () => {
      const html = renderToString(<Label aria-hidden="true">Hidden Label</Label>);
      expect(html).toContain('aria-hidden="true"');
    });
  });

  describe("children", () => {
    it("should render text children", () => {
      const html = renderToString(<Label>Password</Label>);
      expect(html).toContain("Password");
    });

    it("should render complex children", () => {
      const html = renderToString(
        <Label>
          <span>Required</span> Field
        </Label>
      );
      expect(html).toContain("<span>Required</span>");
      expect(html).toContain("Field");
    });
  });
});
