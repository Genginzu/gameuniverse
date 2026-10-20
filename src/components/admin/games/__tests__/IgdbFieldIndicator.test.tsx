import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { IgdbFieldIndicator } from "@/components/admin/games/IgdbFieldIndicator";
import { TRACKABLE_FIELDS } from "@/lib/services/igdb-fields/registry";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

describe("IgdbFieldIndicator", () => {
  it.each(TRACKABLE_FIELDS)("renders nothing for an overridden %s field", (fieldName) => {
    const { container } = render(<IgdbFieldIndicator fieldName={fieldName} isIgdbField={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an accessible IGDB badge for fields still holding IGDB data", () => {
    render(<IgdbFieldIndicator fieldName="genres" isIgdbField />);
    const badge = screen.getByLabelText("igdbFieldTooltip");
    expect(badge).toHaveTextContent("IGDB");
    expect(badge).toHaveAttribute("title", "igdbFieldTooltip");
  });
});
