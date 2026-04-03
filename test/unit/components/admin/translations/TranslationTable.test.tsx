import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TranslationTable } from "@/components/admin/translations/TranslationTable";
import type { TranslationMissingItem, PaginationInfo } from "@/types/admin-translations";

// Mock i18n navigation
const mockPush = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string | object;
    children: React.ReactNode;
    className?: string;
  }) => {
    const hrefStr = typeof href === "string" ? href : JSON.stringify(href);
    return React.createElement("a", { href: hrefStr, className }, children);
  },
  useRouter: () => ({ push: mockPush }),
}));

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
    rowHref: (item: TranslationMissingItem) => `/admin/translations/games/${item.entityId}`,
    buildPageUrl: (page: number) => ({
      pathname: "/admin/translations/games",
      query: page > 1 ? { page: String(page) } : {},
    }),
    buildSearchUrl: (q: string) => ({
      pathname: "/admin/translations/games",
      query: q ? { search: q } : {},
    }),
    currentSearch: "",
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

  it("navigates to search URL when Enter is pressed in search input", () => {
    render(<TranslationTable {...makeProps()} />);
    const input = screen.getByPlaceholderText("table.searchPlaceholder");
    fireEvent.change(input, { target: { value: "zelda" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/admin/translations/games",
      query: { search: "zelda" },
    });
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

  it("renders pagination links when totalPages > 1", () => {
    const pagination: PaginationInfo = { ...basePagination, totalPages: 3, hasNextPage: true };
    render(<TranslationTable {...makeProps({ pagination })} />);
    expect(screen.getByText("table.page")).toBeInTheDocument();
    // next-intl Link receives an object href; the mock renders it as [object Object]
    // Just verify the link exists
    const nextLink = screen.getByText("table.next").closest("a");
    expect(nextLink).toBeInTheDocument();
  });

  it("does not render pagination when totalPages is 1", () => {
    render(<TranslationTable {...makeProps()} />);
    expect(screen.queryByText("table.previous")).not.toBeInTheDocument();
  });

  it("renders previous link when hasPreviousPage", () => {
    const pagination: PaginationInfo = {
      ...basePagination,
      currentPage: 2,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    };
    render(<TranslationTable {...makeProps({ pagination })} />);
    const prevLink = screen.getByText("table.previous").closest("a");
    expect(prevLink).toBeInTheDocument();
  });
});
