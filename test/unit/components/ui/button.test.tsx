import { describe, it, expect } from "vitest";
import { Button, buttonVariants } from "../../../../src/components/ui/button";

describe("Button component", () => {
  describe("buttonVariants", () => {
    it("should generate default variant classes", () => {
      const classes = buttonVariants();
      expect(classes).toContain("bg-primary");
      expect(classes).toContain("text-primary-foreground");
    });

    it("should generate destructive variant classes", () => {
      const classes = buttonVariants({ variant: "destructive" });
      expect(classes).toContain("bg-destructive");
      expect(classes).toContain("text-destructive-foreground");
    });

    it("should generate outline-solid variant classes", () => {
      const classes = buttonVariants({ variant: "outline" });
      expect(classes).toContain("border");
      expect(classes).toContain("bg-background");
    });

    it("should generate secondary variant classes", () => {
      const classes = buttonVariants({ variant: "secondary" });
      expect(classes).toContain("bg-secondary");
      expect(classes).toContain("text-secondary-foreground");
    });

    it("should generate ghost variant classes", () => {
      const classes = buttonVariants({ variant: "ghost" });
      expect(classes).toContain("hover:bg-accent");
    });

    it("should generate link variant classes", () => {
      const classes = buttonVariants({ variant: "link" });
      expect(classes).toContain("text-primary");
      expect(classes).toContain("underline-offset-4");
    });

    it("should generate default size classes", () => {
      const classes = buttonVariants();
      expect(classes).toContain("h-10");
      expect(classes).toContain("px-4");
    });

    it("should generate sm size classes", () => {
      const classes = buttonVariants({ size: "sm" });
      expect(classes).toContain("h-9");
      expect(classes).toContain("px-3");
    });

    it("should generate lg size classes", () => {
      const classes = buttonVariants({ size: "lg" });
      expect(classes).toContain("h-12");
      expect(classes).toContain("px-8");
    });

    it("should generate icon size classes", () => {
      const classes = buttonVariants({ size: "icon" });
      expect(classes).toContain("h-10");
      expect(classes).toContain("w-10");
    });

    it("should combine variant and size", () => {
      const classes = buttonVariants({ variant: "destructive", size: "lg" });
      expect(classes).toContain("bg-destructive");
      expect(classes).toContain("h-12");
    });

    it("should include base classes", () => {
      const classes = buttonVariants();
      expect(classes).toContain("inline-flex");
      expect(classes).toContain("items-center");
      expect(classes).toContain("justify-center");
      expect(classes).toContain("rounded-xl");
    });

    it("should include focus and disabled states", () => {
      const classes = buttonVariants();
      expect(classes).toContain("focus-visible:outline-hidden");
      expect(classes).toContain("disabled:pointer-events-none");
      expect(classes).toContain("disabled:opacity-50");
    });

    it("should merge custom className", () => {
      const classes = buttonVariants({ className: "custom-class" });
      expect(classes).toContain("custom-class");
    });
  });

  describe("Button component export", () => {
    it("should export Button component", () => {
      expect(Button).toBeDefined();
    });

    it("should have displayName", () => {
      expect(Button.displayName).toBe("Button");
    });

    it("should export buttonVariants function", () => {
      expect(buttonVariants).toBeDefined();
      expect(typeof buttonVariants).toBe("function");
    });
  });
});
