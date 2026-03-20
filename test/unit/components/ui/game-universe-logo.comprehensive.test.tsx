import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { GameUniverseLogo } from "../../../../src/components/ui/game-universe-logo";

describe("GameUniverseLogo component rendering", () => {
  describe("basic rendering", () => {
    it("should render a div container", () => {
      const html = renderToString(<GameUniverseLogo />);
      expect(html).toContain("<div");
      expect(html).toContain("</div>");
    });

    it("should render the G letter", () => {
      const html = renderToString(<GameUniverseLogo />);
      expect(html).toContain(">G</span>");
    });

    it("should apply gradient background classes", () => {
      const html = renderToString(<GameUniverseLogo />);
      expect(html).toContain("bg-linear-to-br");
      expect(html).toContain("from-blue-500");
      expect(html).toContain("via-purple-600");
      expect(html).toContain("to-purple-700");
    });

    it("should apply base styling classes", () => {
      const html = renderToString(<GameUniverseLogo />);
      expect(html).toContain("flex");
      expect(html).toContain("items-center");
      expect(html).toContain("justify-center");
      expect(html).toContain("rounded-2xl");
      expect(html).toContain("shadow-lg");
    });
  });

  describe("size prop", () => {
    it("should render small size (sm)", () => {
      const html = renderToString(<GameUniverseLogo size="sm" />);
      expect(html).toContain("w-8");
      expect(html).toContain("h-8");
      expect(html).toContain("text-sm");
    });

    it("should render medium size (md) by default", () => {
      const html = renderToString(<GameUniverseLogo />);
      expect(html).toContain("w-12");
      expect(html).toContain("h-12");
      expect(html).toContain("text-lg");
    });

    it("should render medium size (md) explicitly", () => {
      const html = renderToString(<GameUniverseLogo size="md" />);
      expect(html).toContain("w-12");
      expect(html).toContain("h-12");
      expect(html).toContain("text-lg");
    });

    it("should render large size (lg)", () => {
      const html = renderToString(<GameUniverseLogo size="lg" />);
      expect(html).toContain("w-16");
      expect(html).toContain("h-16");
      expect(html).toContain("text-2xl");
    });

    it("should render extra large size (xl)", () => {
      const html = renderToString(<GameUniverseLogo size="xl" />);
      expect(html).toContain("w-24");
      expect(html).toContain("h-24");
      expect(html).toContain("text-4xl");
    });
  });

  describe("animate prop", () => {
    it("should not have animate-spin by default", () => {
      const html = renderToString(<GameUniverseLogo />);
      expect(html).not.toContain("animate-spin");
    });

    it("should not have animate-spin when animate is false", () => {
      const html = renderToString(<GameUniverseLogo animate={false} />);
      expect(html).not.toContain("animate-spin");
    });

    it("should have animate-spin when animate is true", () => {
      const html = renderToString(<GameUniverseLogo animate={true} />);
      expect(html).toContain("animate-spin");
    });
  });

  describe("className prop", () => {
    it("should merge custom className", () => {
      const html = renderToString(<GameUniverseLogo className="my-custom-class" />);
      expect(html).toContain("my-custom-class");
      expect(html).toContain("bg-linear-to-br");
    });

    it("should handle multiple custom classes", () => {
      const html = renderToString(<GameUniverseLogo className="mb-2 mt-4" />);
      expect(html).toContain("mt-4");
      expect(html).toContain("mb-2");
    });
  });

  describe("combined props", () => {
    it("should handle size and animate together", () => {
      const html = renderToString(<GameUniverseLogo size="lg" animate={true} />);
      expect(html).toContain("w-16");
      expect(html).toContain("h-16");
      expect(html).toContain("animate-spin");
    });

    it("should handle all props together", () => {
      const html = renderToString(
        <GameUniverseLogo size="xl" animate={true} className="custom-logo" />
      );
      expect(html).toContain("w-24");
      expect(html).toContain("h-24");
      expect(html).toContain("animate-spin");
      expect(html).toContain("custom-logo");
    });
  });

  describe("text styling", () => {
    it("should have white text color", () => {
      const html = renderToString(<GameUniverseLogo />);
      expect(html).toContain("text-white");
    });

    it("should have font-bold", () => {
      const html = renderToString(<GameUniverseLogo />);
      expect(html).toContain("font-bold");
    });

    it("should have select-none to prevent text selection", () => {
      const html = renderToString(<GameUniverseLogo />);
      expect(html).toContain("select-none");
    });
  });
});
