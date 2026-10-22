import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

import { StatsSection } from "@/components/home/StatsSection";

vi.mock("@/hooks/useInView", () => ({ useInView: () => true }));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

const STATS = { games: 5321, characters: 2104, players: 812, reviews: 1290 };
const FORMATTED = ["5,321", "2,104", "812", "1,290"];

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn() })
  );
});

describe("StatsSection", () => {
  it("renders the real counts formatted for the locale", () => {
    render(<StatsSection stats={STATS} />);

    for (const value of FORMATTED) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("gamesReferenced")).toBeInTheDocument();
    expect(screen.getByText("players")).toBeInTheDocument();
  });

  it("keeps the final value in the markup before the count-up runs", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
    vi.stubGlobal("requestAnimationFrame", vi.fn());

    const { container } = render(<StatsSection stats={STATS} />);

    const srOnly = Array.from(container.querySelectorAll(".sr-only")).map((n) => n.textContent);
    expect(srOnly).toEqual(FORMATTED);
  });
});
