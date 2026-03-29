import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TranslationTableRow } from "@/components/admin/translations/TranslationTableRow";
import type { TranslationMissingItem } from "@/types/admin-translations";

function makeItem(overrides: Partial<TranslationMissingItem> = {}): TranslationMissingItem {
  return {
    entityId: "uuid-1",
    identifier: "the-legend-of-zelda",
    sourceText: { title: "The Legend of Zelda", description: "An adventure game" },
    sourceLang: "en",
    missingLangs: ["fr"],
    ...overrides,
  };
}

function renderRow(ui: React.ReactElement) {
  return render(
    <table>
      <tbody>{ui}</tbody>
    </table>
  );
}

const defaultProps = {
  isSelected: false,
  isTranslating: false,
  onToggleSelect: vi.fn(),
  onTranslate: vi.fn(),
  onTranslateAndReview: vi.fn(),
  onRowClick: vi.fn(),
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

  it("renders source language badge", () => {
    renderRow(<TranslationTableRow item={makeItem()} {...defaultProps} />);
    expect(screen.getByText("languages.en")).toBeInTheDocument();
  });

  it("renders missing language badges", () => {
    renderRow(
      <TranslationTableRow item={makeItem({ missingLangs: ["fr", "en"] })} {...defaultProps} />
    );
    expect(screen.getByText("languages.fr")).toBeInTheDocument();
    // "languages.en" appears twice: once as source badge, once as missing badge
    expect(screen.getAllByText("languages.en")).toHaveLength(2);
  });

  it("calls onToggleSelect when checkbox is clicked", () => {
    const onToggleSelect = vi.fn();
    renderRow(
      <TranslationTableRow item={makeItem()} {...defaultProps} onToggleSelect={onToggleSelect} />
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggleSelect).toHaveBeenCalledWith("uuid-1");
  });

  it("checkbox reflects isSelected prop", () => {
    renderRow(<TranslationTableRow item={makeItem()} {...defaultProps} isSelected={true} />);
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
  });

  it("calls onTranslate when Translate button is clicked", () => {
    const onTranslate = vi.fn();
    const item = makeItem();
    renderRow(<TranslationTableRow item={item} {...defaultProps} onTranslate={onTranslate} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
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
    fireEvent.click(screen.getAllByRole("button")[1]);
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
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
