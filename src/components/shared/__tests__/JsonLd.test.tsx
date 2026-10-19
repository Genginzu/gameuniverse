import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { JsonLd } from "@/components/shared/JsonLd";

describe("JsonLd", () => {
  it("cannot be closed early by data containing </script>", () => {
    const { container } = render(
      <JsonLd data={{ name: "</script><script>alert(1)</script>" }} />
    );
    const scripts = container.querySelectorAll("script");
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent ?? "")).toEqual({
      name: "</script><script>alert(1)</script>",
    });
  });
});
