import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { AdminDataTable, type AdminColumnDef } from "../AdminDataTable";
import type { PaginationInfo } from "@/types/pagination";

interface Row {
  id: string;
  slug: string;
  name: string;
}

type TableProps = Parameters<typeof AdminDataTable<Row>>[0];

const ROWS: Row[] = [
  { id: "1", slug: "action", name: "Action" },
  { id: "2", slug: "puzzle", name: "Puzzle" },
];

const COLUMNS: AdminColumnDef<Row>[] = [
  { key: "slug", labelKey: "columns.slug", sortable: true },
  { key: "name", labelKey: "columns.name", render: (row) => `name:${row.name}` },
];

const SINGLE_PAGE: PaginationInfo = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 2,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

function renderTable(overrides: Partial<TableProps> = {}) {
  const props: TableProps = {
    items: ROWS,
    columns: COLUMNS,
    pagination: SINGLE_PAGE,
    onPageChange: vi.fn(),
    onSearch: vi.fn(),
    onSort: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    isLoading: false,
    currentSort: { field: "slug", order: "asc" },
    translationNamespace: "admin.test",
    ...overrides,
  };
  render(<AdminDataTable<Row> {...props} />);
  return props;
}

describe("AdminDataTable", () => {
  it("renders one row per item using raw values or the column renderer", () => {
    renderTable();
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText("action")).toBeInTheDocument();
    expect(within(rows[1]).getByText("name:Action")).toBeInTheDocument();
  });

  it("shows the empty state when there are no items", () => {
    renderTable({ items: [] });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("empty")).toBeInTheDocument();
  });

  it("hides the table while loading", () => {
    renderTable({ isLoading: true });
    expect(screen.queryByText("action")).not.toBeInTheDocument();
  });

  it("only makes sortable columns clickable", () => {
    renderTable();
    expect(screen.getByRole("button", { name: "columns.slug" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "columns.name" })).not.toBeInTheDocument();
  });

  it("toggles asc to desc when clicking the active sort column", () => {
    const props = renderTable({ currentSort: { field: "slug", order: "asc" } });
    fireEvent.click(screen.getByRole("button", { name: "columns.slug" }));
    expect(props.onSort).toHaveBeenCalledWith("slug", "desc");
  });

  it.each([
    { field: "slug", order: "desc" as const },
    { field: "name", order: "asc" as const },
  ])("sorts asc when current sort is $field/$order", (currentSort) => {
    const props = renderTable({ currentSort });
    fireEvent.click(screen.getByRole("button", { name: "columns.slug" }));
    expect(props.onSort).toHaveBeenCalledWith("slug", "asc");
  });

  it("edits on row click and deletes without triggering edit", () => {
    const props = renderTable();
    const firstRow = screen.getAllByRole("row")[1];

    fireEvent.click(within(firstRow).getByText("action"));
    expect(props.onEdit).toHaveBeenCalledWith(ROWS[0]);

    vi.mocked(props.onEdit).mockClear();
    fireEvent.click(within(firstRow).getByRole("button", { name: "delete" }));
    expect(props.onDelete).toHaveBeenCalledWith(ROWS[0]);
    expect(props.onEdit).not.toHaveBeenCalled();
  });

  it("submits the search query", () => {
    const props = renderTable();
    fireEvent.change(screen.getByRole("textbox", { name: "searchPlaceholder" }), {
      target: { value: "act" },
    });
    fireEvent.click(screen.getByRole("button", { name: "search" }));
    expect(props.onSearch).toHaveBeenCalledWith("act");
  });

  describe("pagination", () => {
    it("is hidden when there is a single page", () => {
      renderTable();
      expect(screen.queryByRole("button", { name: "nextPage" })).not.toBeInTheDocument();
    });

    it("disables previous on the first page and moves forward", () => {
      const props = renderTable({
        pagination: { ...SINGLE_PAGE, totalPages: 3, hasNextPage: true },
      });
      expect(screen.getByRole("button", { name: "previousPage" })).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: "nextPage" }));
      expect(props.onPageChange).toHaveBeenCalledWith(2);
    });

    it("disables next on the last page and moves backward", () => {
      const props = renderTable({
        pagination: { ...SINGLE_PAGE, currentPage: 3, totalPages: 3, hasPreviousPage: true },
      });
      expect(screen.getByRole("button", { name: "nextPage" })).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: "previousPage" }));
      expect(props.onPageChange).toHaveBeenCalledWith(2);
    });
  });
});
