import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { createSWRWrapper } from "@/test-helpers/swr-wrapper";
import type { CharactersApiResponse, CharacterSummary } from "@/types/character";
import type { Pagination } from "@/types/pagination";

const mocks = vi.hoisted(() => ({ fetcher: vi.fn() }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));
vi.mock("@/lib/swr/fetcher", () => ({ fetcher: (url: string) => mocks.fetcher(url) }));
vi.mock("@/hooks/useCharacterFilters", () => ({
  useCharacterFilters: () => ({ roles: [], platforms: [] }),
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

import { AllCharactersContent } from "../AllCharactersContent";

const CHARACTER = { id: "c1", slug: "link", name: "Link" } as CharacterSummary;
const NETWORK_CHARACTER = { id: "c2", slug: "zelda", name: "Zelda" } as CharacterSummary;
const PAGES: Pagination = {
  currentPage: 1,
  totalPages: 4,
  totalCount: 80,
  hasNextPage: true,
  hasPreviousPage: false,
};

function respond(payload: CharactersApiResponse | "pending") {
  mocks.fetcher.mockImplementation(() =>
    payload === "pending" ? new Promise(() => {}) : Promise.resolve(payload)
  );
}

const requestedUrls = () => mocks.fetcher.mock.calls.map((call) => String(call[0]));
const renderContent = (props: React.ComponentProps<typeof AllCharactersContent> = {}) =>
  render(<AllCharactersContent {...props} />, { wrapper: createSWRWrapper() });

describe("AllCharactersContent", () => {
  beforeEach(() => {
    mocks.fetcher.mockReset();
    respond({ characters: [NETWORK_CHARACTER], pagination: PAGES });
    window.scrollTo = vi.fn();
  });

  it("renders the ISR data immediately without refetching page 1", async () => {
    respond("pending");
    renderContent({ locale: "en", initialData: { characters: [CHARACTER], pagination: PAGES } });

    expect(screen.getByText("card:Link")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(requestedUrls()).toEqual([]);
  });

  it("requests page 1 with no filters when no server data was provided", async () => {
    renderContent({ locale: "en" });

    await waitFor(() =>
      expect(requestedUrls()).toEqual(["/api/characters?locale=en&page=1&limit=20"])
    );
  });

  it("filters by role and platform and drops the fallback once filtered", async () => {
    renderContent({ initialData: { characters: [CHARACTER], pagination: PAGES } });
    fireEvent.click(screen.getByText("pick-role"));
    fireEvent.click(screen.getByText("pick-platform"));

    await waitFor(() =>
      expect(requestedUrls()).toContain(
        "/api/characters?locale=fr&page=1&limit=20&roles=protagonist&platforms=pc"
      )
    );
    expect(await screen.findByText("card:Zelda")).toBeInTheDocument();
  });

  it("resets to page 1 when a filter changes after paginating", async () => {
    renderContent();
    fireEvent.click(await screen.findByText("go-page-3"));
    await waitFor(() =>
      expect(requestedUrls()).toContain("/api/characters?locale=fr&page=3&limit=20")
    );
    expect(window.scrollTo).toHaveBeenCalled();

    fireEvent.click(screen.getByText("pick-role"));
    await waitFor(() =>
      expect(requestedUrls()).toContain(
        "/api/characters?locale=fr&page=1&limit=20&roles=protagonist"
      )
    );
  });

  it("clears every filter back to the default query", async () => {
    mocks.fetcher.mockImplementation((url: string) =>
      Promise.resolve({
        characters: [url.includes("roles=") ? CHARACTER : NETWORK_CHARACTER],
        pagination: PAGES,
      })
    );
    renderContent();
    expect(await screen.findByText("card:Zelda")).toBeInTheDocument();

    fireEvent.click(screen.getByText("pick-role"));
    fireEvent.click(screen.getByText("pick-platform"));
    expect(await screen.findByText("card:Link")).toBeInTheDocument();

    fireEvent.click(screen.getByText("clear"));
    expect(await screen.findByText("card:Zelda")).toBeInTheDocument();
  });

  it("shows the skeleton only during the initial load", () => {
    respond("pending");
    renderContent();
    expect(screen.getByText("skeleton")).toBeInTheDocument();
  });

  it("shows the no-characters empty state without filters", async () => {
    respond({ characters: [], pagination: { ...PAGES, totalPages: 1 } });
    renderContent();
    expect(await screen.findByText("empty.noCharacters")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "empty.clearFilters" })).not.toBeInTheDocument();
  });

  it("offers to clear filters when a filtered search is empty", async () => {
    respond({ characters: [], pagination: { ...PAGES, totalPages: 1 } });
    renderContent();
    fireEvent.click(screen.getByText("pick-role"));

    expect(await screen.findByText("empty.description")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "empty.clearFilters" }));
    await waitFor(() => expect(screen.getByText("empty.noCharacters")).toBeInTheDocument());
  });

  it("hides pagination for a single page", async () => {
    respond({ characters: [NETWORK_CHARACTER], pagination: { ...PAGES, totalPages: 1 } });
    renderContent();
    await screen.findByText("card:Zelda");
    expect(screen.queryByText("go-page-3")).not.toBeInTheDocument();
  });
});
