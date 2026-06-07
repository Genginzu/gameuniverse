import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SpotlightCard } from "@/components/shared/SpotlightCard";

describe("SpotlightCard", () => {
  describe("rendering", () => {
    it("renders children inside a div by default", () => {
      render(
        <SpotlightCard>
          <span data-testid="child">Hello</span>
        </SpotlightCard>
      );

      expect(screen.getByTestId("child").textContent).toBe("Hello");
      expect(screen.getByTestId("child").parentElement?.tagName).toBe("DIV");
    });

    it("applies the spotlight-card class plus user className", () => {
      render(
        <SpotlightCard className="my-custom-class">
          <span data-testid="child">x</span>
        </SpotlightCard>
      );

      const root = screen.getByTestId("child").parentElement;
      expect(root?.className).toContain("spotlight-card");
      expect(root?.className).toContain("my-custom-class");
    });

    it("renders as <article> when as='article'", () => {
      render(
        <SpotlightCard as="article">
          <span data-testid="child">x</span>
        </SpotlightCard>
      );

      const root = screen.getByTestId("child").parentElement;
      expect(root?.tagName).toBe("ARTICLE");
    });

    it("renders as <section> when as='section'", () => {
      render(
        <SpotlightCard as="section">
          <span data-testid="child">x</span>
        </SpotlightCard>
      );

      const root = screen.getByTestId("child").parentElement;
      expect(root?.tagName).toBe("SECTION");
    });

    it("renders as <a> with href when as='a'", () => {
      render(
        <SpotlightCard as="a" href="/foo">
          <span data-testid="child">x</span>
        </SpotlightCard>
      );

      const root = screen.getByTestId("child").parentElement as HTMLAnchorElement;
      expect(root.tagName).toBe("A");
      expect(root.getAttribute("href")).toBe("/foo");
    });
  });

  describe("glow color override", () => {
    it("does not set --spotlight-glow when no glowColor is given", () => {
      render(
        <SpotlightCard>
          <span data-testid="child">x</span>
        </SpotlightCard>
      );

      const root = screen.getByTestId("child").parentElement as HTMLElement;
      expect(root.style.getPropertyValue("--spotlight-glow")).toBe("");
    });

    it("sets --spotlight-glow when glowColor is provided", () => {
      render(
        <SpotlightCard glowColor="168 85 247">
          <span data-testid="child">x</span>
        </SpotlightCard>
      );

      const root = screen.getByTestId("child").parentElement as HTMLElement;
      expect(root.style.getPropertyValue("--spotlight-glow")).toBe("168 85 247");
    });
  });

  describe("mouse tracking", () => {
    it("updates --spotlight-mx and --spotlight-my on mousemove", () => {
      render(
        <SpotlightCard>
          <span data-testid="child">x</span>
        </SpotlightCard>
      );

      const root = screen.getByTestId("child").parentElement as HTMLElement;

      // Simulate a known bounding box so getBoundingClientRect returns
      // predictable values in jsdom (which by default returns zeros).
      root.getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          right: 200,
          bottom: 100,
          width: 200,
          height: 100,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;

      fireEvent.mouseMove(root, { clientX: 50, clientY: 25 });

      expect(root.style.getPropertyValue("--spotlight-mx")).toBe("25%");
      expect(root.style.getPropertyValue("--spotlight-my")).toBe("25%");

      fireEvent.mouseMove(root, { clientX: 200, clientY: 100 });

      expect(root.style.getPropertyValue("--spotlight-mx")).toBe("100%");
      expect(root.style.getPropertyValue("--spotlight-my")).toBe("100%");
    });

    it("ignores mousemove when ref is somehow detached", () => {
      // We can't easily detach the ref through the public API, but we can at
      // least confirm that mousemove on an unmounted card doesn't throw.
      const { unmount } = render(
        <SpotlightCard>
          <span data-testid="child">x</span>
        </SpotlightCard>
      );

      const root = screen.getByTestId("child").parentElement as HTMLElement;
      unmount();

      // Firing mousemove on the detached node must not throw.
      expect(() => fireEvent.mouseMove(root, { clientX: 10, clientY: 10 })).not.toThrow();
    });
  });
});
