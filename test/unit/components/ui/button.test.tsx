import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { Button, buttonVariants } from "../../../../src/components/ui/button";

describe("Button component", () => {
  describe("component export", () => {
    it("should export Button component", () => {
      expect(Button).toBeDefined();
    });

    it("should export buttonVariants", () => {
      expect(buttonVariants).toBeDefined();
      expect(typeof buttonVariants).toBe("function");
    });

    it("should have displayName", () => {
      expect(Button.displayName).toBe("Button");
    });
  });

  describe("rendering variants", () => {
    it("should render with default variant", () => {
      const html = renderToString(<Button>Default</Button>);
      expect(html).toContain("Default");
      expect(html).toContain("bg-primary");
    });

    it("should render with destructive variant", () => {
      const html = renderToString(<Button variant="destructive">Delete</Button>);
      expect(html).toContain("Delete");
      expect(html).toContain("bg-destructive");
    });

    it("should render with outline-solid variant", () => {
      const html = renderToString(<Button variant="outline">Outline</Button>);
      expect(html).toContain("Outline");
      expect(html).toContain("border");
    });

    it("should render with secondary variant", () => {
      const html = renderToString(<Button variant="secondary">Secondary</Button>);
      expect(html).toContain("Secondary");
      expect(html).toContain("bg-secondary");
    });

    it("should render with ghost variant", () => {
      const html = renderToString(<Button variant="ghost">Ghost</Button>);
      expect(html).toContain("Ghost");
    });

    it("should render with link variant", () => {
      const html = renderToString(<Button variant="link">Link</Button>);
      expect(html).toContain("Link");
      expect(html).toContain("underline-offset-4");
    });
  });

  describe("rendering sizes", () => {
    it("should render with default size", () => {
      const html = renderToString(<Button>Default Size</Button>);
      expect(html).toContain("h-10");
      expect(html).toContain("px-4");
    });

    it("should render with sm size", () => {
      const html = renderToString(<Button size="sm">Small</Button>);
      expect(html).toContain("h-9");
      expect(html).toContain("px-3");
    });

    it("should render with lg size", () => {
      const html = renderToString(<Button size="lg">Large</Button>);
      expect(html).toContain("h-12");
      expect(html).toContain("px-8");
    });

    it("should render with icon size", () => {
      const html = renderToString(<Button size="icon">🔍</Button>);
      expect(html).toContain("h-10");
      expect(html).toContain("w-10");
    });
  });

  describe("asChild prop", () => {
    it("should render as button by default", () => {
      const html = renderToString(<Button>Click me</Button>);
      expect(html).toContain("<button");
    });

    it("should render as Slot when asChild is true", () => {
      const html = renderToString(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      expect(html).toContain("Link Button");
      expect(html).toContain('href="/test"');
    });
  });

  describe("additional props", () => {
    it("should apply custom className", () => {
      const html = renderToString(<Button className="custom-btn">Custom</Button>);
      expect(html).toContain("custom-btn");
    });

    it("should pass through disabled prop", () => {
      const html = renderToString(<Button disabled>Disabled</Button>);
      expect(html).toContain("disabled");
    });

    it("should pass through type prop", () => {
      const html = renderToString(<Button type="submit">Submit</Button>);
      expect(html).toContain('type="submit"');
    });
  });

  describe("buttonVariants function", () => {
    it("should return default classes", () => {
      const classes = buttonVariants();
      expect(classes).toContain("inline-flex");
      expect(classes).toContain("rounded-xl");
      expect(classes).toContain("bg-primary");
      expect(classes).toContain("h-10");
    });

    it("should return variant-specific classes", () => {
      expect(buttonVariants({ variant: "destructive" })).toContain("bg-destructive");
      expect(buttonVariants({ variant: "outline" })).toContain("border");
      expect(buttonVariants({ variant: "secondary" })).toContain("bg-secondary");
      expect(buttonVariants({ variant: "ghost" })).toContain("hover:bg-accent");
      expect(buttonVariants({ variant: "link" })).toContain("underline-offset-4");
    });

    it("should return size-specific classes", () => {
      expect(buttonVariants({ size: "sm" })).toContain("h-9");
      expect(buttonVariants({ size: "lg" })).toContain("h-12");
      expect(buttonVariants({ size: "icon" })).toContain("w-10");
    });

    it("should combine variant and size", () => {
      const classes = buttonVariants({ variant: "destructive", size: "lg" });
      expect(classes).toContain("bg-destructive");
      expect(classes).toContain("h-12");
    });

    it("should include custom className", () => {
      const classes = buttonVariants({ className: "my-custom-class" });
      expect(classes).toContain("my-custom-class");
    });
  });
});
