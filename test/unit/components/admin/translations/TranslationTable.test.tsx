import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TranslationTable } from "@/components/admin/translations/TranslationTable";
import type { TranslationMissingItem, PaginationInfo } from "@/types/admin-translations";

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

const basePagination: PaginationInfo = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 1,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    items: [makeItem()],
    pagination: basePagination,
    selectedIds: new Set<string>(),
    onToggleSelect: vi.fn(),
    onSelectAll: vi.fn(),
    onClearSelection: vi.fn(),
    onTranslate: vi.fn(),
    onTranslateAndReview: vi.fn(),
    onRowClick: vi.fn(),
    onPageChange: vi.fn(),
    onSearch: vi.fn(),
    isLoading: false,
    translatingIds: new Set<string>(),
    ...overrides,
  };
}

describe("TranslationTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the search input", () => {
    render(<TranslationTable {...makeProps()} />);
    expect(screen.getByPlaceholderText("table.searchPlaceholder")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<TranslationTable {...makeProps()} />);
    expect(screen.getByText("table.source")).toBeInTheDocument();
    expect(screen.getByText("table.sourceLang")).toBeInTheDocument();
    expect(screen.getByText("table.missingLangs")).toBeInTheDocument();
    expect(screen.getByText("table.actions")).toBeInTheDocument();
  });

  it("renders items via TranslationTableRow", () => {
    render(<TranslationTable {...makeProps()} />);
    expect(screen.getByText("The Legend of Zelda")).toBeInTheDocument();
    expect(screen.getByText("the-legend-of-zelda")).toBeInTheDocument();
  });

  it("shows skeleton rows when loading", () => {
    render(<TranslationTable {...makeProps({ isLoading: true, items: [] })} />);
    expect(screen.queryByText("The Legend of Zelda")).not.toBeInTheDocument();
  });

  it("shows empty state when no items and not loading", () => {
    render(<TranslationTable {...makeProps({ items: [] })} />);
    expect(screen.getByText("table.noResults")).toBeInTheDocument();
  });

  it("calls onSearch when Enter is pressed in search input", () => {
    const onSearch = vi.fn();
    render(<TranslationTable {...makeProps({ onSearch })} />);
    const input = screen.getByPlaceholderText("table.searchPlaceholder");
    fireEvent.change(input, { target: { value: "zelda" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSearch).toHaveBeenCalledWith("zelda");
  });

  it("shows 'Translate All' button", () => {
    render(<TranslationTable {...makeProps()} />);
    expect(screen.getByText("buttons.translateAll")).toBeInTheDocument();
  });

  it("shows 'Translate Selection' button when items are selected", () => {
    render(<TranslationTable {...makeProps({ selectedIds: new Set(["uuid-1"]) })} />);
    expect(screen.getByText("buttons.translateSelection")).toBeInTheDocument();
  });

  it("calls onSelectAll when select-all checkbox is checked", () => {
    const onSelectAll = vi.fn();
    render(<TranslationTable {...makeProps({ onSelectAll })} />);
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onSelectAll).toHaveBeenCalledWith(["uuid-1"]);
  });

  it("calls onClearSelection when all items are already selected", () => {
    const onClearSelection = vi.fn();
    render(
      <TranslationTable {...makeProps({ selectedIds: new Set(["uuid-1"]), onClearSelection })} />
    );
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onClearSelection).toHaveBeenCalled();
  });

  it("renders pagination when totalPages > 1", () => {
    const pagination: PaginationInfo = { ...basePagination, totalPages: 3, hasNextPage: true };
    render(<TranslationTable {...makeProps({ pagination })} />);
    expect(screen.getByText("table.page")).toBeInTheDocument();
    expect(screen.getByText("table.next")).toBeInTheDocument();
  });

  it("does not render pagination when totalPages is 1", () => {
    render(<TranslationTable {...makeProps()} />);
    expect(screen.queryByText("table.previous")).not.toBeInTheDocument();
  });

  it("calls onPageChange when next button is clicked", () => {
    const onPageChange = vi.fn();
    const pagination: PaginationInfo = { ...basePagination, totalPages: 3, hasNextPage: true };
    render(<TranslationTable {...makeProps({ pagination, onPageChange })} />);
    fireEvent.click(screen.getByText("table.next"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
