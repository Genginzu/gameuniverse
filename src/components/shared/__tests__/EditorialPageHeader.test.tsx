import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { EditorialPageHeader } from "../EditorialPageHeader";

describe("EditorialPageHeader", () => {
  it("renders the kicker, the title with its accent and the subtitle", () => {
    render(
      <EditorialPageHeader kicker="Community" title="Your" titleAccent="groups" subtitle="Hello" />
    );
    expect(screen.getByText("Community")).toBeDefined();
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Your groups");
    expect(screen.getByText("groups").className).toContain("text-editorial-accent");
    expect(screen.getByText("Hello")).toBeDefined();
  });

  it("uses a plain block layout without aside nor actions", () => {
    const { container } = render(<EditorialPageHeader kicker="K" title="T" />);
    const header = container.querySelector("header");
    expect(header?.className).not.toContain("grid");
    expect(header?.className).not.toContain("flex");
  });

  it("switches to the two-column grid when an aside is provided", () => {
    const { container } = render(
      <EditorialPageHeader kicker="K" title="T" aside={<div>Stats</div>} />
    );
    expect(container.querySelector("header")?.className).toContain("lg:grid-cols-[5fr_7fr]");
    expect(screen.getByText("Stats")).toBeDefined();
  });

  it("renders actions next to the title", () => {
    const { container } = render(
      <EditorialPageHeader kicker="K" title="T" actions={<button type="button">Act</button>} />
    );
    expect(container.querySelector("header")?.className).toContain("sm:justify-between");
    expect(screen.getByRole("button", { name: "Act" })).toBeDefined();
  });

  it("adds a bottom separator in compact variant", () => {
    const { container } = render(<EditorialPageHeader variant="compact" kicker="K" title="T" />);
    expect(container.querySelector("header")?.className).toContain("border-b");
  });

  it("renders extra children below the subtitle", () => {
    render(
      <EditorialPageHeader kicker="K" title="T" subtitle="S">
        <a href="/x">Extra</a>
      </EditorialPageHeader>
    );
    expect(screen.getByRole("link", { name: "Extra" })).toBeDefined();
  });
});
