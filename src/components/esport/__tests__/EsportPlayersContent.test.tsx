import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { createSWRWrapper } from "@/test-helpers/swr-wrapper";

const mocks = vi.hoisted(() => ({ fetcher: vi.fn() }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/lib/swr/fetcher", () => ({ fetcher: (url: string) => mocks.fetcher(url) }));
vi.mock("../EsportPlayerCard", () => ({
  EsportPlayerCard: ({ player }: { player: { name: string } }) => <div>player:{player.name}</div>,
}));
vi.mock("@/components/shared/Pagination", () => ({
  Pagination: ({ onPageChange }: { onPageChange: (p: number) => void }) => (
    <button onClick={() => onPageChange(2)}>go-page-2</button>
  ),
}));

import { EsportPlayersContent, type EsportPlayersData } from "../EsportPlayersContent";

const PLAYERS: EsportPlayersData = {
  players: [
    {
      id: 1,
      name: "Faker",
      slug: "faker",
      firstName: null,
      lastName: null,
      nationality: null,
      imageUrl: null,
      role: null,
      teamName: null,
      game: "LoL",
    },
  ],
  total: 60,
  page: 1,
  limit: 25,
};

const playerUrls = () =>
  mocks.fetcher.mock.calls
    .map((call) => String(call[0]))
    .filter((url) => !url.includes("games_only"));

describe("EsportPlayersContent", () => {
  beforeEach(() => {
    mocks.fetcher.mockReset();
    mocks.fetcher.mockImplementation((url: string) =>
      Promise.resolve(url.includes("games_only") ? { games: ["LoL", "CS2"] } : PLAYERS)
    );
    window.scrollTo = vi.fn();
  });

  const renderContent = (initialData?: EsportPlayersData) =>
    render(<EsportPlayersContent initialData={initialData} />, { wrapper: createSWRWrapper() });

  it("uses the ISR payload on the default view and loads the game chips", async () => {
    renderContent(PLAYERS);
    expect(screen.getByText("player:Faker")).toBeInTheDocument();
    expect(await screen.findByText("CS2")).toBeInTheDocument();
    await waitFor(() => expect(playerUrls()).toEqual(["/api/esport/players"]));
  });

  it("resets to the first page in a single request when the game filter changes", async () => {
    renderContent();
    fireEvent.click(await screen.findByText("go-page-2"));
    await waitFor(() => expect(playerUrls()).toContain("/api/esport/players?page=2"));

    fireEvent.click(await screen.findByText("CS2"));
    await waitFor(() => expect(playerUrls()).toContain("/api/esport/players?game=CS2"));
    expect(playerUrls()).not.toContain("/api/esport/players?game=CS2&page=2");
  });

  it("applies the debounced search on the first page without a stale paged request", async () => {
    renderContent();
    fireEvent.click(await screen.findByText("go-page-2"));
    await waitFor(() => expect(playerUrls()).toContain("/api/esport/players?page=2"));

    fireEvent.change(screen.getByPlaceholderText("searchPlaceholder"), {
      target: { value: "fak" },
    });
    expect(screen.getByDisplayValue("fak")).toBeInTheDocument();

    await waitFor(() => expect(playerUrls()).toContain("/api/esport/players?search=fak"));
    expect(playerUrls().filter((url) => url.includes("search=fak"))).toEqual([
      "/api/esport/players?search=fak",
    ]);
  });
});
