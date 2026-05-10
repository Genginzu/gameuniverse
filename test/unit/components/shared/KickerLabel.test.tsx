import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KickerLabel } from "@/components/shared/KickerLabel";

describe("KickerLabel", () => {
  it("renders children inside a <p> by default", () => {
    render(<KickerLabel>HELLO</KickerLabel>);
    const node = screen.getByText("HELLO");
    expect(node.tagName).toBe("P");
    expect(node.className).toContain("editorial-kicker");
  });

  it("renders as the requested element when as is provided", () => {
    render(<KickerLabel as="span">WORLD</KickerLabel>);
    const node = screen.getByText("WORLD");
    expect(node.tagName).toBe("SPAN");
  });

  it("merges user className with editorial-kicker", () => {
    render(<KickerLabel className="mb-4 text-white/80">FOO</KickerLabel>);
    const node = screen.getByText("FOO");
    expect(node.className).toContain("editorial-kicker");
    expect(node.className).toContain("mb-4");
    expect(node.className).toContain("text-white/80");
  });

  it("supports rendering rich children (nodes, not just strings)", () => {
    render(
      <KickerLabel>
        <strong data-testid="strong">BOLD</strong> · text
      </KickerLabel>
    );
    expect(screen.getByTestId("strong").textContent).toBe("BOLD");
    expect(screen.getByText(/text/i)).toBeDefined();
  });
});
