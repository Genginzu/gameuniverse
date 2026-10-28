import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import fr from "@/messages/fr.json";
import { UniverseSection } from "@/components/games/details/sections/UniverseSection";
import type { GameDetails, GameGenre } from "@/types/game";
import type { GameDetailMetadata, GameMultiplayerMode } from "@/types/game-metadata";

vi.mock("next-intl", async () => vi.importActual("next-intl"));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname: string; query: Record<string, string> };
    children: React.ReactNode;
  }) => {
    const url =
      typeof href === "string"
        ? href
        : `${href.pathname}?${new URLSearchParams(href.query).toString()}`;
    return (
      <a href={url} {...props}>
        {children}
      </a>
    );
  },
}));

const noMultiplayer: GameMultiplayerMode = {
  platformName: null,
  campaignCoop: false,
  dropIn: false,
  lanCoop: false,
  offlineCoop: false,
  offlineCoopMax: null,
  offlineMax: null,
  onlineCoop: false,
  onlineCoopMax: null,
  onlineMax: null,
  splitscreen: false,
  splitscreenOnline: false,
};

const emptyMetadata: GameDetailMetadata = {
  themes: [],
  gameModes: [],
  playerPerspectives: [],
  gameEngines: [],
  franchises: [],
  websites: [],
  multiplayerModes: [],
  franchiseGames: [],
};

function renderSection(metadata: GameDetailMetadata | undefined, genres: GameGenre[] = []) {
  const game = { slug: "witcher-3", metadata, genres } as unknown as GameDetails;
  return render(
    <NextIntlClientProvider locale="fr" messages={fr}>
      <UniverseSection game={game} />
    </NextIntlClientProvider>
  );
}

describe("UniverseSection", () => {
  it("renders nothing without metadata", () => {
    const { container } = renderSection(emptyMetadata);
    expect(container).toBeEmptyDOMElement();
  });

  it("links translated taxonomies to the filtered games listing, without modes or perspectives", () => {
    renderSection({
      ...emptyMetadata,
      themes: [{ igdbId: 38, slug: "open-world", name: "Open world" }],
      gameModes: [{ igdbId: 99, slug: "new-mode", name: "New mode" }],
      gameEngines: [{ igdbId: 1, slug: "redengine", name: "REDengine" }],
      franchises: [{ kind: "franchise", slug: "the-witcher", name: "The Witcher" }],
    });

    expect(screen.getByRole("link", { name: "Monde ouvert" }).getAttribute("href")).toContain(
      "themes=open-world"
    );
    expect(screen.queryByText("New mode")).toBeNull();
    expect(screen.getByRole("link", { name: "REDengine" }).getAttribute("href")).toContain(
      "engines=redengine"
    );
    expect(screen.getByRole("link", { name: "The Witcher" }).getAttribute("href")).toBe(
      "/franchises/the-witcher"
    );
  });

  it("lists genres in the technical sheet, linked to the filtered games listing", () => {
    renderSection(emptyMetadata, [{ id: "g1", slug: "role-playing-rpg", name: "RPG" }]);

    expect(screen.getByText("Genre")).toBeTruthy();
    expect(screen.getByRole("link", { name: "RPG" }).getAttribute("href")).toContain("genres=RPG");
  });

  it("merges multiplayer modes and lists websites official site first", () => {
    renderSection({
      ...emptyMetadata,
      multiplayerModes: [
        { ...noMultiplayer, platformName: "PC", onlineMax: 4 },
        { ...noMultiplayer, platformName: "PS5", onlineMax: 8, splitscreen: true },
      ],
      websites: [
        { url: "https://store.steampowered.com/app/292030", typeId: 13, trusted: true },
        { url: "https://thewitcher.com", typeId: 1, trusted: false },
      ],
    });

    expect(screen.getByText("Jusqu'à 8 joueurs")).toBeTruthy();
    expect(screen.getByText("Écran partagé")).toBeTruthy();
    expect(screen.getByText("Détails IGDB pour : PC, PS5")).toBeTruthy();

    const links = within(
      screen.getByRole("heading", { name: "Liens" }).parentElement as HTMLElement
    )
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(links[0]).toContain("Site officiel");
    expect(links[1]).toContain("Steam");
  });
});
