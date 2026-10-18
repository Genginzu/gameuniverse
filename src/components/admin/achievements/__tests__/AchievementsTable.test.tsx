import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { AchievementsTable, type AchievementsTableProps } from "../AchievementsTable";
import type { AdminAchievement } from "@/types/admin-achievements";
import type { PaginationInfo } from "@/types/pagination";

const intl = vi.hoisted(() => ({ locale: "fr" }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => intl.locale,
}));

const ACHIEVEMENT: AdminAchievement = {
  id: "ach-1",
  key: "first_game",
  category: "library",
  tier: "bronze",
  threshold: 1,
  xpValue: 50,
  icon: "trophy",
  nameFr: "Premier jeu",
  nameEn: "First Game",
  descriptionFr: "",
  descriptionEn: "",
  sortOrder: 1,
};

const PAGINATION: PaginationInfo = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 1,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

function renderTable(overrides: Partial<AchievementsTableProps> = {}) {
  const props: AchievementsTableProps = {
    achievements: [ACHIEVEMENT],
    pagination: PAGINATION,
    onPageChange: vi.fn(),
    onSearch: vi.fn(),
    onSort: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    isLoading: false,
    currentSort: { field: "key", order: "asc" },
    currentSearch: "",
    ...overrides,
  };
  render(<AchievementsTable {...props} />);
  return props;
}

describe("AchievementsTable", () => {
  beforeEach(() => {
    intl.locale = "fr";
  });

  it("renders the French name by default", () => {
    renderTable();
    expect(screen.getByText("Premier jeu")).toBeInTheDocument();
    expect(screen.queryByText("First Game")).not.toBeInTheDocument();
  });

  it("renders the English name for the en locale", () => {
    intl.locale = "en";
    renderTable();
    expect(screen.getByText("First Game")).toBeInTheDocument();
  });

  it("renders category and tier through translation keys", () => {
    renderTable();
    expect(screen.getByText("categories.library")).toBeInTheDocument();
    expect(screen.getByText("tiers.bronze")).toBeInTheDocument();
  });

  it("shows the empty state when there are no achievements", () => {
    renderTable({ achievements: [] });
    expect(screen.getByText("noAchievements")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("toggles the active sort column and resets others to asc", () => {
    const props = renderTable({ currentSort: { field: "key", order: "asc" } });
    fireEvent.click(screen.getByRole("button", { name: "columns.key" }));
    fireEvent.click(screen.getByRole("button", { name: "columns.xpValue" }));
    expect(props.onSort).toHaveBeenNthCalledWith(1, "key", "desc");
    expect(props.onSort).toHaveBeenNthCalledWith(2, "xp_value", "asc");
  });

  it("edits by id on row click and deletes without triggering edit", () => {
    const props = renderTable();
    const row = screen.getAllByRole("row")[1];

    fireEvent.click(within(row).getByText("first_game"));
    expect(props.onEdit).toHaveBeenCalledWith("ach-1");

    vi.mocked(props.onEdit).mockClear();
    fireEvent.click(within(row).getByRole("button", { name: "deleteAchievement" }));
    expect(props.onDelete).toHaveBeenCalledWith(ACHIEVEMENT);
    expect(props.onEdit).not.toHaveBeenCalled();
  });
});
