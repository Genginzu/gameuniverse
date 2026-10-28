import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import fr from "@/messages/fr.json";
import { GameplayBentoCell } from "@/components/games/details/sections/GameplayBentoCell";
import type { GameDetailMetadata } from "@/types/game-metadata";

vi.mock("next-intl", async () => vi.importActual("next-intl"));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: { pathname: string; query: Record<string, string> };
    children: React.ReactNode;
  }) => (
    <a href={`${href.pathname}?${new URLSearchParams(href.query).toString()}`} {...props}>
      {children}
    </a>
  ),
}));

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

function renderCell(metadata?: GameDetailMetadata) {
  return render(
    <NextIntlClientProvider locale="fr" messages={fr}>
      <GameplayBentoCell metadata={metadata} />
    </NextIntlClientProvider>
  );
}

describe("GameplayBentoCell", () => {
  it("renders nothing without modes or perspectives", () => {
    const { container } = renderCell(emptyMetadata);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing without metadata", () => {
    const { container } = renderCell(undefined);
    expect(container).toBeEmptyDOMElement();
  });

  it("links game modes and perspectives to the filtered games listing", () => {
    renderCell({
      ...emptyMetadata,
      gameModes: [{ igdbId: 999, slug: "new-mode", name: "New mode" }],
      playerPerspectives: [{ igdbId: 999, slug: "new-view", name: "New view" }],
    });

    expect(screen.getByRole("link", { name: "New mode" }).getAttribute("href")).toContain(
      "gameModes=new-mode"
    );
    expect(screen.getByRole("link", { name: "New view" }).getAttribute("href")).toContain(
      "perspectives=new-view"
    );
  });
});
