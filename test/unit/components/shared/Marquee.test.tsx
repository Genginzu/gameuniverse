import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Marquee } from "@/components/shared/Marquee";

describe("Marquee", () => {
  it("renders the children", () => {
    render(
      <Marquee>
        <span data-testid="item">Item</span>
      </Marquee>
    );
    // The content is duplicated for the infinite scroll effect, so the
    // testid actually appears twice. getAllByTestId is the safer assertion.
    expect(screen.getAllByTestId("item").length).toBe(2);
  });

  it("duplicates the content with aria-hidden on the second copy", () => {
    const { container } = render(
      <Marquee>
        <span>Hello</span>
      </Marquee>
    );
    const tracks = container.querySelectorAll(".marquee > div");
    expect(tracks.length).toBe(2);
    // First track is visible to AT, second is decorative.
    expect(tracks[0].getAttribute("aria-hidden")).toBeNull();
    expect(tracks[1].getAttribute("aria-hidden")).toBe("true");
  });

  it("applies the marquee class on the inner track wrapper", () => {
    const { container } = render(
      <Marquee>
        <span>x</span>
      </Marquee>
    );
    expect(container.querySelector(".marquee")).not.toBeNull();
  });

  it("applies the user className on the outer overflow wrapper", () => {
    const { container } = render(
      <Marquee className="my-bg">
        <span>x</span>
      </Marquee>
    );
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain("overflow-hidden");
    expect(outer.className).toContain("my-bg");
  });

  it("supports overriding the gap class", () => {
    const { container } = render(
      <Marquee gapClassName="gap-4">
        <span>x</span>
      </Marquee>
    );
    const tracks = container.querySelectorAll(".marquee > div");
    expect(tracks[0].className).toContain("gap-4");
    expect(tracks[1].className).toContain("gap-4");
  });
});
