import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DynamicAccent } from "@/components/shared/DynamicAccent";
import { MAGENTA_PALETTE, paletteFromHex } from "@/lib/utils/accent-palette";

describe("DynamicAccent", () => {
  it("renders children inside a <div> by default", () => {
    render(
      <DynamicAccent palette={MAGENTA_PALETTE}>
        <span data-testid="child">Hello</span>
      </DynamicAccent>
    );
    const child = screen.getByTestId("child");
    expect(child.textContent).toBe("Hello");
    expect(child.parentElement?.tagName).toBe("DIV");
  });

  it("renders as the requested element via 'as' prop", () => {
    render(
      <DynamicAccent palette={MAGENTA_PALETTE} as="section">
        <span data-testid="child">x</span>
      </DynamicAccent>
    );
    expect(screen.getByTestId("child").parentElement?.tagName).toBe("SECTION");
  });

  it("injects --accent-50 through --accent-900 as inline CSS variables", () => {
    render(
      <DynamicAccent palette={MAGENTA_PALETTE}>
        <span data-testid="child">x</span>
      </DynamicAccent>
    );
    const wrapper = screen.getByTestId("child").parentElement as HTMLElement;
    expect(wrapper.style.getPropertyValue("--accent-50")).toBe(MAGENTA_PALETTE.scale[50]);
    expect(wrapper.style.getPropertyValue("--accent-500")).toBe(MAGENTA_PALETTE.scale[500]);
    expect(wrapper.style.getPropertyValue("--accent-900")).toBe(MAGENTA_PALETTE.scale[900]);
  });

  it("injects --accent-rgb and --accent-glow with the same triplet", () => {
    render(
      <DynamicAccent palette={MAGENTA_PALETTE}>
        <span data-testid="child">x</span>
      </DynamicAccent>
    );
    const wrapper = screen.getByTestId("child").parentElement as HTMLElement;
    expect(wrapper.style.getPropertyValue("--accent-rgb")).toBe(MAGENTA_PALETTE.rgbTriplet);
    expect(wrapper.style.getPropertyValue("--accent-glow")).toBe(MAGENTA_PALETTE.rgbTriplet);
  });

  it("sets a data-accent attribute with the palette name (debug aid)", () => {
    render(
      <DynamicAccent palette={MAGENTA_PALETTE}>
        <span data-testid="child">x</span>
      </DynamicAccent>
    );
    const wrapper = screen.getByTestId("child").parentElement as HTMLElement;
    expect(wrapper.getAttribute("data-accent")).toBe("magenta");
  });

  it("forwards the className prop", () => {
    render(
      <DynamicAccent palette={MAGENTA_PALETTE} className="my-wrapper">
        <span data-testid="child">x</span>
      </DynamicAccent>
    );
    const wrapper = screen.getByTestId("child").parentElement as HTMLElement;
    expect(wrapper.className).toContain("my-wrapper");
  });

  it("works with a palette generated dynamically from hex", () => {
    const dyn = paletteFromHex("#ff4655", "valorant");
    render(
      <DynamicAccent palette={dyn}>
        <span data-testid="child">x</span>
      </DynamicAccent>
    );
    const wrapper = screen.getByTestId("child").parentElement as HTMLElement;
    expect(wrapper.style.getPropertyValue("--accent-rgb")).toBe("255 70 85");
    expect(wrapper.getAttribute("data-accent")).toBe("valorant");
  });
});
