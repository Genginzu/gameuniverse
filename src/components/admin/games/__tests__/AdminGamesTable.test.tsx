import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { AdminGamesTable, type AdminGamesTableProps } from "../AdminGamesTable";
import type { AdminGame } from "@/types/admin-games";
import type { PaginationInfo } from "@/types/pagination";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const GAME: AdminGame = {
  id: "game-1",
  slug: "zelda",
  title: "Zelda",
  coverImage: "https://example.com/zelda.jpg",
  releaseDate: "2024-01-15",
  updatedAt: "2025-01-10T12:00:00Z",
};

const PAGINATION: PaginationInfo = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 1,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

function renderTable(overrides: Partial<AdminGamesTableProps> = {}) {
  const props: AdminGamesTableProps = {
    games: [GAME],
    pagination: PAGINATION,
    onPageChange: vi.fn(),
    onSearch: vi.fn(),
    onSort: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    canDelete: true,
    isLoading: false,
    ...overrides,
  };
  render(<AdminGamesTable {...props} />);
  return props;
}

const firstRow = () => screen.getAllByRole("row")[1];

describe("AdminGamesTable", () => {
  it("renders the cover, title and formatted dates", () => {
    renderTable();
    const row = firstRow();
    expect(within(row).getByRole("img", { name: "Zelda" })).toBeInTheDocument();
    expect(
      within(row).getByText(new Date(GAME.releaseDate!).toLocaleDateString())
    ).toBeInTheDocument();
    expect(
      within(row).getByText(new Date(GAME.updatedAt).toLocaleDateString())
    ).toBeInTheDocument();
  });

  it("shows a placeholder for a missing cover and a dash for a missing release date", () => {
    renderTable({ games: [{ ...GAME, coverImage: null, releaseDate: null }] });
    const row = firstRow();
    expect(within(row).queryByRole("img")).not.toBeInTheDocument();
    expect(within(row).getByText("—")).toBeInTheDocument();
  });

  it("shows the empty state", () => {
    renderTable({ games: [] });
    expect(screen.getByText("noGames")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("starts unsorted columns ascending and toggles the active one", () => {
    const props = renderTable({ currentSort: { field: "title", order: "asc" } });
    fireEvent.click(screen.getByRole("button", { name: "columns.title" }));
    fireEvent.click(screen.getByRole("button", { name: "columns.releaseDate" }));
    expect(props.onSort).toHaveBeenNthCalledWith(1, "title", "desc");
    expect(props.onSort).toHaveBeenNthCalledWith(2, "release_date", "asc");
  });

  it("sorts ascending when no sort is set yet", () => {
    const props = renderTable({ currentSort: undefined });
    fireEvent.click(screen.getByRole("button", { name: "columns.updatedAt" }));
    expect(props.onSort).toHaveBeenCalledWith("updated_at", "asc");
  });

  it("edits on row click and deletes without triggering edit", () => {
    const props = renderTable();
    fireEvent.click(within(firstRow()).getByText("Zelda"));
    expect(props.onEdit).toHaveBeenCalledWith("game-1");

    vi.mocked(props.onEdit).mockClear();
    fireEvent.click(within(firstRow()).getByRole("button", { name: "deleteGame" }));
    expect(props.onDelete).toHaveBeenCalledWith(GAME);
    expect(props.onEdit).not.toHaveBeenCalled();
  });

  it("hides the delete action when the user cannot delete", () => {
    renderTable({ canDelete: false });
    expect(screen.queryByRole("button", { name: "deleteGame" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "editGame" })).toBeInTheDocument();
  });

  it("paginates when there are several pages", () => {
    const props = renderTable({
      pagination: { ...PAGINATION, totalPages: 3, hasNextPage: true },
    });
    fireEvent.click(screen.getByRole("button", { name: "nextPage" }));
    expect(props.onPageChange).toHaveBeenCalledWith(2);
  });
});
