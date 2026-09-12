import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatXL } from "@/components/shared/StatXL";

describe("StatXL", () => {
  it("renders the value and the label", () => {
    render(<StatXL value="10K+" label="JEUX REFERENCES" />);
    expect(screen.getByText("10K+")).toBeDefined();
    expect(screen.getByText("JEUX REFERENCES")).toBeDefined();
  });

  it("applies editorial-display on the value and editorial-kicker on the label", () => {
    render(<StatXL value="240+" label="TOURNOIS LIVE" />);
    const value = screen.getByText("240+");
    const label = screen.getByText("TOURNOIS LIVE");
    expect(value.className).toContain("editorial-display");
    expect(label.className).toContain("editorial-kicker");
  });

  it("renders as a <div> by default and supports as='li' / 'article'", () => {
    const { rerender } = render(<StatXL value="1" label="X" />);
    expect(screen.getByText("X").parentElement?.tagName).toBe("DIV");

    rerender(<StatXL value="2" label="Y" as="li" />);
    expect(screen.getByText("Y").parentElement?.tagName).toBe("LI");

    rerender(<StatXL value="3" label="Z" as="article" />);
    expect(screen.getByText("Z").parentElement?.tagName).toBe("ARTICLE");
  });

  it("supports React node values (not only strings)", () => {
    render(
      <StatXL
        value={
          <span>
            10<span data-testid="suffix">K+</span>
          </span>
        }
        label="USERS"
      />
    );
    expect(screen.getByTestId("suffix").textContent).toBe("K+");
    expect(screen.getByText("USERS")).toBeDefined();
  });

  it("merges user className on the wrapper", () => {
    render(<StatXL value="1" label="X" className="mt-8 lg:mt-12" />);
    const wrapper = screen.getByText("X").parentElement;
    expect(wrapper?.className).toContain("mt-8");
    expect(wrapper?.className).toContain("lg:mt-12");
    expect(wrapper?.className).toContain("flex");
  });
});
