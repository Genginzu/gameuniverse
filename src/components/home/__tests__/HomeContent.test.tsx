import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

import { HomeContent } from "@/components/home/HomeContent";
import type { HomeApiResponse } from "@/types/home";

const auth = vi.hoisted(() => ({ state: { user: null as unknown, loading: true } }));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => auth.state }));

vi.mock("@/components/home/HomeLanding", () => ({
  HomeLanding: () => React.createElement("div", { "data-testid": "home-landing" }),
}));

vi.mock("@/components/home/HomeDashboard", () => ({
  HomeDashboard: () => React.createElement("div", { "data-testid": "home-dashboard" }),
}));

const DATA: HomeApiResponse = {
  trending: [],
  upcoming: [],
  popularCharacters: [],
  recentReviews: [],
  showcaseGames: [],
  showcaseCharacters: [],
  stats: null,
};

beforeEach(() => {
  auth.state = { user: null, loading: true };
});

describe("HomeContent", () => {
  it("renders the landing while auth is loading", () => {
    render(<HomeContent initialHomeData={DATA} />);
    expect(screen.getByTestId("home-landing")).toBeInTheDocument();
    expect(screen.queryByTestId("home-dashboard")).not.toBeInTheDocument();
  });

  it("renders the landing for a logged-out visitor", () => {
    auth.state = { user: null, loading: false };
    render(<HomeContent initialHomeData={DATA} />);
    expect(screen.getByTestId("home-landing")).toBeInTheDocument();
  });

  it("switches to the dashboard once a user is resolved", () => {
    auth.state = { user: { id: "u1" }, loading: false };
    render(<HomeContent initialHomeData={DATA} />);
    expect(screen.getByTestId("home-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("home-landing")).not.toBeInTheDocument();
  });
});
