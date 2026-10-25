import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { DashboardEditorial } from "@/components/dashboard/DashboardEditorial";

const swr = vi.hoisted(() => ({
  keys: [] as string[],
  responses: {} as Record<string, unknown>,
}));

vi.mock("swr", () => ({
  default: (key: string) => {
    swr.keys.push(key);
    return { data: swr.responses[key], isLoading: !(key in swr.responses) };
  },
}));

vi.mock("next-intl", () => {
  const t = Object.assign((key: string) => key, {
    rich: (key: string) => key,
  });
  return { useTranslations: () => t };
});

const USER = { id: "u1", email: "player@example.com", username: "player", createdAt: "2025-01-01" };

beforeEach(() => {
  swr.keys = [];
  swr.responses = {};
});

describe("DashboardEditorial", () => {
  it("only requests the library stats, never the full library", () => {
    render(<DashboardEditorial user={USER} />);
    expect(swr.keys).toContain("/api/library/stats");
    expect(swr.keys).not.toContain("/api/library");
  });

  it("shows placeholders while the stats load", () => {
    render(<DashboardEditorial user={USER} />);
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("renders the loaded stats", () => {
    swr.responses["/api/library/stats"] = {
      totalGames: 40,
      ownedGames: 30,
      completedGames: 10,
      totalPlayTime: 123,
    };
    render(<DashboardEditorial user={USER} />);

    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("· 25%")).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();
  });
});
