import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { AdminReviewsTable, type AdminReviewsTableProps } from "../AdminReviewsTable";
import type { AdminReview } from "@/types/admin-reviews";
import type { PaginationInfo } from "@/types/pagination";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const REVIEW: AdminReview = {
  id: "review-1",
  rating: 15,
  contentExcerpt: "Great game with nice graphics",
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  playerName: "player1",
  playerEmail: "player1@example.com",
  gameTitle: "Zelda",
  gameId: "game-1",
};

const PAGINATION: PaginationInfo = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 1,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

function renderTable(overrides: Partial<AdminReviewsTableProps> = {}) {
  const props: AdminReviewsTableProps = {
    reviews: [REVIEW],
    pagination: PAGINATION,
    onPageChange: vi.fn(),
    onSearch: vi.fn(),
    onSort: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    canDelete: true,
    isLoading: false,
    currentSort: { field: "created_at", order: "desc" },
    currentSearch: "",
    ...overrides,
  };
  render(<AdminReviewsTable {...props} />);
  return props;
}

describe("AdminReviewsTable", () => {
  it("renders player, game, excerpt and formatted date", () => {
    renderTable();
    const row = screen.getAllByRole("row")[1];
    expect(within(row).getByText("player1")).toBeInTheDocument();
    expect(within(row).getByText("Zelda")).toBeInTheDocument();
    expect(within(row).getByText(REVIEW.contentExcerpt)).toBeInTheDocument();
    expect(
      within(row).getByText(new Date(REVIEW.createdAt).toLocaleDateString())
    ).toBeInTheDocument();
  });

  it("falls back to the anonymous label when the player name is missing", () => {
    renderTable({ reviews: [{ ...REVIEW, playerName: null }] });
    expect(screen.getByText("anonymousPlayer")).toBeInTheDocument();
  });

  it("shows the empty state when there are no reviews", () => {
    renderTable({ reviews: [] });
    expect(screen.getByText("noReviews")).toBeInTheDocument();
  });

  it("sorts each header with asc/desc toggling on the active column", () => {
    const props = renderTable({ currentSort: { field: "rating", order: "asc" } });
    fireEvent.click(screen.getByRole("button", { name: "columns.rating" }));
    fireEvent.click(screen.getByRole("button", { name: "columns.date" }));
    expect(props.onSort).toHaveBeenNthCalledWith(1, "rating", "desc");
    expect(props.onSort).toHaveBeenNthCalledWith(2, "created_at", "asc");
  });

  it("edits by id on row click and deletes without triggering edit", () => {
    const props = renderTable();
    const row = screen.getAllByRole("row")[1];

    fireEvent.click(within(row).getByText("Zelda"));
    expect(props.onEdit).toHaveBeenCalledWith("review-1");

    vi.mocked(props.onEdit).mockClear();
    fireEvent.click(within(row).getByRole("button", { name: "deleteReview" }));
    expect(props.onDelete).toHaveBeenCalledWith(REVIEW);
    expect(props.onEdit).not.toHaveBeenCalled();
  });

  it("hides the delete action when the user cannot delete", () => {
    renderTable({ canDelete: false });
    expect(screen.queryByRole("button", { name: "deleteReview" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "editReview" })).toBeInTheDocument();
  });
});
