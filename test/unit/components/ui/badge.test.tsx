import { describe, it, expect } from "bun:test";
import { renderToString } from "react-dom/server";
import { Badge, badgeVariants } from "../../../../src/components/ui/badge";

describe("Badge component", () => {
  describe("component export", () => {
    it("should export Badge component", () => {
      expect(Badge).toBeDefined();
    });

    it("should export badgeVariants", () => {
      expect(badgeVariants).toBeDefined();
      expect(typeof badgeVariants).toBe("function");
    });

    it("should be a function component", () => {
      expect(typeof Badge).toBe("function");
    });
  });

  describe("rendering", () => {
    it("should render with default variant", () => {
      const html = renderToString(<Badge>Default Badge</Badge>);
      expect(html).toContain("Default Badge");
      expect(html).toContain("bg-primary");
    });

    it("should render with secondary variant", () => {
      const html = renderToString(<Badge variant="secondary">Secondary</Badge>);
      expect(html).toContain("Secondary");
      expect(html).toContain("bg-secondary");
    });

    it("should render with destructive variant", () => {
      const html = renderToString(<Badge variant="destructive">Destructive</Badge>);
      expect(html).toContain("Destructive");
      expect(html).toContain("bg-destructive");
    });

    it("should render with outline variant", () => {
      const html = renderToString(<Badge variant="outline">Outline</Badge>);
      expect(html).toContain("Outline");
      expect(html).toContain("text-foreground");
    });

    it("should apply custom className", () => {
      const html = renderToString(<Badge className="custom-class">Custom</Badge>);
      expect(html).toContain("custom-class");
    });

    it("should pass through additional props", () => {
      const html = renderToString(<Badge data-testid="test-badge">Test</Badge>);
      expect(html).toContain('data-testid="test-badge"');
    });
  });

  describe("badgeVariants function", () => {
    it("should return default classes when no variant specified", () => {
      const classes = badgeVariants();
      expect(classes).toContain("inline-flex");
      expect(classes).toContain("rounded-full");
      expect(classes).toContain("bg-primary");
    });

    it("should return secondary classes", () => {
      const classes = badgeVariants({ variant: "secondary" });
      expect(classes).toContain("bg-secondary");
    });

    it("should return destructive classes", () => {
      const classes = badgeVariants({ variant: "destructive" });
      expect(classes).toContain("bg-destructive");
    });

    it("should return outline classes", () => {
      const classes = badgeVariants({ variant: "outline" });
      expect(classes).toContain("text-foreground");
    });
  });
});
