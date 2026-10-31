import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { HeroLibraryControl } from "@/components/games/details/sections/HeroLibraryControl";
import type { LibraryStatus } from "@/types/library";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    values?.status ? `${key}:${values.status}` : key,
}));

const toastMock = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/use-toast", () => ({ toast: toastMock }));

const entry = vi.hoisted(() => ({
  state: {
    inLibrary: false,
    status: undefined as LibraryStatus | undefined,
    loading: false,
    adding: false,
    addToLibrary: (() => Promise.resolve(true)) as () => Promise<boolean>,
    addToWishlist: (() => Promise.resolve(true)) as () => Promise<boolean>,
    removeFromLibrary: (() => Promise.resolve(true)) as () => Promise<boolean>,
    setStatus: ((_status: LibraryStatus) => Promise.resolve(true)) as (
      status: LibraryStatus
    ) => Promise<boolean>,
  },
}));
vi.mock("@/hooks/useGameLibraryStatus", () => ({ useGameLibraryStatus: () => entry.state }));

beforeEach(() => {
  toastMock.mockReset();
  entry.state = {
    inLibrary: false,
    status: undefined,
    loading: false,
    adding: false,
    addToLibrary: vi.fn().mockResolvedValue(true),
    addToWishlist: vi.fn().mockResolvedValue(true),
    removeFromLibrary: vi.fn().mockResolvedValue(true),
    setStatus: vi.fn().mockResolvedValue(true),
  };
});

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "triggerLabel:playing" }));
}

describe("HeroLibraryControl", () => {
  it("adds a game that is not in the library", () => {
    render(<HeroLibraryControl gameId="g1" />);

    fireEvent.click(screen.getByRole("button", { name: /libraryAdd/ }));

    expect(entry.state.addToLibrary).toHaveBeenCalled();
  });

  it("adds a game that is not in the library to the wishlist", () => {
    render(<HeroLibraryControl gameId="g1" />);

    fireEvent.click(screen.getByRole("button", { name: /wishlistAdd/ }));

    expect(entry.state.addToWishlist).toHaveBeenCalled();
    expect(entry.state.addToLibrary).not.toHaveBeenCalled();
  });

  it("shows the current status and changes it from the menu", () => {
    entry.state = { ...entry.state, inLibrary: true, status: "playing" };
    render(<HeroLibraryControl gameId="g1" />);

    openMenu();
    expect(screen.getByRole("menuitemradio", { name: "playing" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    fireEvent.click(screen.getByRole("menuitemradio", { name: "completed" }));

    expect(entry.state.setStatus).toHaveBeenCalledWith("completed");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("removes the game from the menu", () => {
    entry.state = { ...entry.state, inLibrary: true, status: "playing" };
    render(<HeroLibraryControl gameId="g1" />);

    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "remove" }));

    expect(entry.state.removeFromLibrary).toHaveBeenCalled();
  });

  it("shows a library game without a known status as owned", () => {
    entry.state = { ...entry.state, inLibrary: true, status: undefined };
    render(<HeroLibraryControl gameId="g1" />);

    expect(screen.getByRole("button", { name: "triggerLabel:owned" })).toBeInTheDocument();
  });

  it("reports a failed status change", async () => {
    entry.state = {
      ...entry.state,
      inLibrary: true,
      status: "playing",
      setStatus: vi.fn().mockResolvedValue(false),
    };
    render(<HeroLibraryControl gameId="g1" />);

    openMenu();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "wishlist" }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({ title: "error", variant: "destructive" })
    );
  });
});
