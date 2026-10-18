import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AllCharactersContent } from "../AllCharactersContent";
import type { CharacterSummary } from "@/types/character";
import type { Pagination } from "@/types/pagination";

const mocks = vi.hoisted(() => ({
  useCharacters: vi.fn(),
  result: {
    characters: [] as CharacterSummary[],
    pagination: null as Pagination | null,
    isLoading: false,
    isValidating: false,
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));
vi.mock("@/hooks/useDebouncedValue", () => ({ useDebouncedValue: <T,>(v: T) => v }));
vi.mock("@/hooks/useCharacterFilters", () => ({
  useCharacterFilters: () => ({ roles: [], platforms: [] }),
}));
vi.mock("@/hooks/useCharacters", () => ({
  useCharacters: (...args: unknown[]) => {
    mocks.useCharacters(...args);
    return mocks.result;
  },
}));
vi.mock("@/components/providers/CharacterFavoriteStatusProvider", () => ({
  CharacterFavoriteStatusProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/shared/EntityCard", () => ({
  EntityCard: ({ entity }: { entity: CharacterSummary }) => <div>card:{entity.name}</div>,
}));
vi.mock("@/components/shared/GridSkeleton", () => ({ GridSkeleton: () => <div>skeleton</div> }));
vi.mock("../CharacterFilters", () => ({
  CharacterFilters: (props: {
    onRoleChange: (v: string[]) => void;
    onPlatformsChange: (v: string[]) => void;
    onClearFilters: () => void;
  }) => (
    <div>
      <button onClick={() => props.onRoleChange(["protagonist"])}>pick-role</button>
      <button onClick={() => props.onPlatformsChange(["pc"])}>pick-platform</button>
      <button onClick={props.onClearFilters}>clear</button>
    </div>
  ),
}));
vi.mock("@/components/shared/Pagination", () => ({
  Pagination: ({ onPageChange }: { onPageChange: (p: number) => void }) => (
    <button onClick={() => onPageChange(3)}>go-page-3</button>
  ),
}));

const CHARACTER = { id: "c1", slug: "link", name: "Link" } as CharacterSummary;
const PAGES: Pagination = {
  currentPage: 1,
  totalPages: 4,
  totalCount: 80,
  hasNextPage: true,
  hasPreviousPage: false,
};

const lastQuery = () => mocks.useCharacters.mock.lastCall?.[0];
const lastFallback = () => mocks.useCharacters.mock.lastCall?.[1];

describe("AllCharactersContent", () => {
  beforeEach(() => {
    mocks.useCharacters.mockClear();
    mocks.result = {
      characters: [CHARACTER],
      pagination: PAGES,
      isLoading: false,
      isValidating: false,
    };
    window.scrollTo = vi.fn();
  });

  it("requests page 1 with no filters and uses the ISR data as fallback", () => {
    render(
      <AllCharactersContent locale="en" initialCharacters={[CHARACTER]} initialPagination={PAGES} />
    );
    expect(lastQuery()).toEqual({ locale: "en", search: "", roles: [], platforms: [], page: 1 });
    expect(lastFallback()).toEqual({ characters: [CHARACTER], pagination: PAGES });
    expect(screen.getByText("card:Link")).toBeInTheDocument();
  });

  it("filters by role and platform and drops the fallback once filtered", () => {
    render(<AllCharactersContent initialCharacters={[CHARACTER]} initialPagination={PAGES} />);
    fireEvent.click(screen.getByText("pick-role"));
    fireEvent.click(screen.getByText("pick-platform"));

    expect(lastQuery()).toMatchObject({ roles: ["protagonist"], platforms: ["pc"], page: 1 });
    expect(lastFallback()).toBeUndefined();
  });

  it("resets to page 1 when a filter changes after paginating", () => {
    render(<AllCharactersContent />);
    fireEvent.click(screen.getByText("go-page-3"));
    expect(lastQuery()).toMatchObject({ page: 3 });
    expect(window.scrollTo).toHaveBeenCalled();

    fireEvent.click(screen.getByText("pick-role"));
    expect(lastQuery()).toMatchObject({ page: 1, roles: ["protagonist"] });
  });

  it("clears every filter", () => {
    render(<AllCharactersContent />);
    fireEvent.click(screen.getByText("pick-role"));
    fireEvent.click(screen.getByText("pick-platform"));
    fireEvent.click(screen.getByText("clear"));
    expect(lastQuery()).toMatchObject({ roles: [], platforms: [], page: 1 });
  });

  it("shows the skeleton only during the initial load", () => {
    mocks.result = { characters: [], pagination: null, isLoading: true, isValidating: true };
    render(<AllCharactersContent />);
    expect(screen.getByText("skeleton")).toBeInTheDocument();
  });

  it("shows the no-characters empty state without filters", () => {
    mocks.result = { characters: [], pagination: null, isLoading: false, isValidating: false };
    render(<AllCharactersContent />);
    expect(screen.getByText("empty.noCharacters")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "empty.clearFilters" })).not.toBeInTheDocument();
  });

  it("offers to clear filters when a filtered search is empty", () => {
    mocks.result = { characters: [], pagination: null, isLoading: false, isValidating: false };
    render(<AllCharactersContent />);
    fireEvent.click(screen.getByText("pick-role"));

    expect(screen.getByText("empty.description")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "empty.clearFilters" }));
    expect(lastQuery()).toMatchObject({ roles: [] });
  });

  it("hides pagination for a single page", () => {
    mocks.result.pagination = { ...PAGES, totalPages: 1 };
    render(<AllCharactersContent />);
    expect(screen.queryByText("go-page-3")).not.toBeInTheDocument();
  });
});
