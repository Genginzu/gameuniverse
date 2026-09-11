import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorialHero } from "@/components/shared/EditorialHero";

const baseProps = {
  kicker: "EDITION SPECIALE",
  parts: [
    { type: "text" as const, value: "Bienvenue" },
    { type: "text" as const, value: "sur" },
    { type: "text" as const, value: "Gamers Universe", accent: true },
  ],
  description: "Le hub des passionnés.",
  backgroundImage: "/cover.jpg",
  backgroundAlt: "Cover artwork",
};

describe("EditorialHero", () => {
  it("renders the kicker, the title parts and the description", () => {
    render(<EditorialHero {...baseProps} />);
    expect(screen.getByText("EDITION SPECIALE")).toBeDefined();
    expect(screen.getByText("Bienvenue")).toBeDefined();
    expect(screen.getByText("sur")).toBeDefined();
    expect(screen.getByText("Gamers Universe")).toBeDefined();
    expect(screen.getByText("Le hub des passionnés.")).toBeDefined();
  });

  it("renders the background image with the provided alt", () => {
    render(<EditorialHero {...baseProps} />);
    const img = screen.getByAltText("Cover artwork") as HTMLImageElement;
    expect(img.src).toContain("/cover.jpg");
  });

  it("renders inline images when parts include type='image'", () => {
    render(
      <EditorialHero
        {...baseProps}
        parts={[
          { type: "text", value: "Hello" },
          { type: "image", src: "/avatar.jpg", alt: "Avatar inline" },
          { type: "text", value: "world" },
        ]}
      />
    );
    expect(screen.getByText("Hello")).toBeDefined();
    expect(screen.getByText("world")).toBeDefined();
    // The decorative inline image is rendered with its alt text being kept by
    // the next/image mock (the wrapper has aria-hidden on the span itself).
    expect(screen.getByAltText("Avatar inline")).toBeDefined();
  });

  it("renders a line break when parts include type='break'", () => {
    const { container } = render(
      <EditorialHero
        {...baseProps}
        parts={[
          { type: "text", value: "Top" },
          { type: "break" },
          { type: "text", value: "Bottom" },
        ]}
      />
    );
    const heading = container.querySelector("h1");
    expect(heading?.querySelector("br")).not.toBeNull();
  });

  it("renders the optional ctas slot when provided", () => {
    render(
      <EditorialHero
        {...baseProps}
        ctas={
          <button type="button" data-testid="cta">
            Discover
          </button>
        }
      />
    );
    expect(screen.getByTestId("cta").textContent).toBe("Discover");
  });

  it("does not render the ctas wrapper when ctas is omitted", () => {
    const { container } = render(<EditorialHero {...baseProps} />);
    // No button should exist in the rendered tree by default.
    expect(container.querySelector("button")).toBeNull();
  });

  it("applies the accent gradient class on parts marked accent", () => {
    const { container } = render(<EditorialHero {...baseProps} />);
    const accentSpan = Array.from(container.querySelectorAll("h1 span span")).find((s) =>
      s.textContent === "Gamers Universe"
    );
    expect(accentSpan).toBeDefined();
    expect(accentSpan?.className).toContain("bg-clip-text");
    expect(accentSpan?.className).toContain("text-transparent");
  });
});
