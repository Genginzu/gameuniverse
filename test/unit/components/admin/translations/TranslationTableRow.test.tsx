import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TranslationTableRow } from "@/components/admin/translations/TranslationTableRow";
import type { TranslationMissingItem } from "@/types/admin-translations";

function makeItem(overrides: Partial<TranslationMissingItem> = {}): TranslationMissingItem {
  return {
    entityId: "uuid-1",
    identifier: "the-legend-of-zelda",
    sourceText: { title: "The Legend of Zelda", description: "An adventure game" },
    targetText: {},
    sourceLang: "en",
    status: "missing",
    ...overrides,
  };
}

/** Wraps a <tr> in a valid table structure so React doesn't warn */
function renderRow(ui: React.ReactElement) {
  return render(
    <table>
      <tbody>{ui}</tbody>
    </table>
  );
}

const defaultProps = {
  entityType: "games" as const,
  isSelected: false,
  isTranslating: false,
  onToggleSelect: vi.fn(),
  onTranslate: vi.fn(),
  onTranslateAndReview: vi.fn(),
};

describe("TranslationTableRow", () => {
  it("renders source text preview from first field", () => {
    renderRow(<TranslationTableRow item={makeItem()} {...defaultProps} />);
    expect(screen.getByText("The Legend of Zelda")).toBeInTheDocument();
  });

  it("renders identifier", () => {
    renderRow(<TranslationTableRow item={makeItem()} {...defaultProps} />);
    expect(screen.getByText("the-legend-of-zelda")).toBeInTheDocument();
  });

  it("shows 'missing' indicator when targetText is empty", () => {
    renderRow(<TranslationTableRow item={makeItem()} {...defaultProps} />);
    // "status.missing" appears twice: once as the target cell indicator, once as the status badge
    const missingElements = screen.getAllByText("status.missing");
    expect(missingElements).toHaveLength(2);
    // The italic one is the target cell indicator
    const italicIndicator = missingElements.find((el) => el.classList.contains("italic"));
    expect(italicIndicator).toBeDefined();
  });

  it("shows target text when available", () => {
    const item = makeItem({
      targetText: { title: "La Légende de Zelda" },
      status: "complete",
    });
    renderRow(<TranslationTableRow item={item} {...defaultProps} />);
    expect(screen.getByText("La Légende de Zelda")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    renderRow(<TranslationTableRow item={makeItem({ status: "partial" })} {...defaultProps} />);
    // Status badge text
    expect(screen.getByText("status.partial")).toBeInTheDocument();
  });

  it("calls onToggleSelect when checkbox is clicked", () => {
    const onToggleSelect = vi.fn();
    renderRow(
      <TranslationTableRow item={makeItem()} {...defaultProps} onToggleSelect={onToggleSelect} />
    );
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(onToggleSelect).toHaveBeenCalledWith("uuid-1");
  });

  it("checkbox reflects isSelected prop", () => {
    renderRow(<TranslationTableRow item={makeItem()} {...defaultProps} isSelected={true} />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("calls onTranslate when Translate button is clicked", () => {
    const onTranslate = vi.fn();
    const item = makeItem();
    renderRow(<TranslationTableRow item={item} {...defaultProps} onTranslate={onTranslate} />);
    const buttons = screen.getAllByRole("button");
    // First button is "Traduire"
    fireEvent.click(buttons[0]);
    expect(onTranslate).toHaveBeenCalledWith(item);
  });

  it("calls onTranslateAndReview when second button is clicked", () => {
    const onTranslateAndReview = vi.fn();
    const item = makeItem();
    renderRow(
      <TranslationTableRow
        item={item}
        {...defaultProps}
        onTranslateAndReview={onTranslateAndReview}
      />
    );
    const buttons = screen.getAllByRole("button");
    // Second button is "Traduire et relire"
    fireEvent.click(buttons[1]);
    expect(onTranslateAndReview).toHaveBeenCalledWith(item);
  });

  it("disables buttons when isTranslating is true", () => {
    renderRow(<TranslationTableRow item={makeItem()} {...defaultProps} isTranslating={true} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
  });

  it("renders two action buttons", () => {
    renderRow(<TranslationTableRow item={makeItem()} {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
  });
});
