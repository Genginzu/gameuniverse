import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import type { SessionEventData } from "@/types/activity";

vi.mock("next-intl", () => {
  const createTranslator = () => {
    const t = (key: string, values?: Record<string, unknown>) => {
      if (!values) return key;
      if (key === "durationHm") return `${values.h}h${values.m}min`;
      if (key === "durationH") return `${values.h}h`;
      if (key === "durationM") return `${values.m}min`;
      return key;
    };
    t.rich = (
      key: string,
      values?: Record<string, (chunk?: React.ReactNode) => React.ReactNode>
    ) => {
      if (key === "sessionDescription" && values) {
        return (
          <>
            {values.game?.()}
            {" — "}
            {values.duration?.()}
          </>
        );
      }
      return key;
    };
    t.raw = (key: string) => key;
    t.markup = (key: string) => key;
    t.has = () => true;
    return t;
  };
  return {
    useTranslations: () => createTranslator(),
    useLocale: () => "fr",
  };
});

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { ActivityItemSession } from "@/components/players/activity/ActivityItemSession";

describe("ActivityItemSession", () => {
  const baseData: SessionEventData = {
    type: "session",
    gameId: "g1",
    gameSlug: "witcher-3",
    gameName: "The Witcher 3",
    coverImage: null,
    durationMinutes: 90,
    startedAt: "2026-04-20T12:00:00Z",
  };

  it("renders the game name as a link to the game page", () => {
    render(<ActivityItemSession data={baseData} locale="fr" />);
    const link = screen.getByRole("link", { name: "The Witcher 3" });
    expect(link).toHaveAttribute("href", "/games/witcher-3");
  });

  it("formats duration 90 min as 1h30min", () => {
    render(<ActivityItemSession data={baseData} locale="fr" />);
    expect(screen.getByText(/1h30min/)).toBeInTheDocument();
  });

  it("formats whole hours as 2h", () => {
    render(<ActivityItemSession data={{ ...baseData, durationMinutes: 120 }} locale="fr" />);
    expect(screen.getByText(/2h/)).toBeInTheDocument();
  });

  it("formats sub-hour durations as NNmin", () => {
    render(<ActivityItemSession data={{ ...baseData, durationMinutes: 45 }} locale="fr" />);
    expect(screen.getByText(/45min/)).toBeInTheDocument();
  });
});
