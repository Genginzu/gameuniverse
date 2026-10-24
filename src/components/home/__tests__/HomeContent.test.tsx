import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

import { HomeContent } from "@/components/home/HomeContent";
import { AUTH_HINT_ATTRIBUTE } from "@/lib/utils/authHint";
import type { HomeApiResponse } from "@/types/home";

const auth = vi.hoisted(() => ({ state: { user: null as unknown, loading: true } }));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => auth.state }));

vi.mock("@/components/home/HomeLanding", () => ({
  HomeLanding: () => React.createElement("div", { "data-testid": "home-landing" }),
}));

vi.mock("@/components/home/HomeDashboard", () => ({
  HomeDashboard: () => React.createElement("div", { "data-testid": "home-dashboard" }),
}));

vi.mock("@/components/home/HomeDashboardSkeleton", () => ({
  HomeDashboardSkeleton: ({ className }: { className?: string }) =>
    React.createElement("div", { "data-testid": "home-dashboard-skeleton", className }),
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

function setSessionCookie(present: boolean) {
  document.cookie = present
    ? "sb-test-auth-token=token; path=/"
    : "sb-test-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

beforeEach(() => {
  auth.state = { user: null, loading: true };
  setSessionCookie(false);
});

afterEach(() => {
  setSessionCookie(false);
  document.documentElement.removeAttribute(AUTH_HINT_ATTRIBUTE);
});

describe("HomeContent", () => {
  it("renders the landing with a hidden skeleton while auth loads for a visitor", () => {
    render(<HomeContent initialHomeData={DATA} />);
    expect(screen.getByTestId("home-landing")).toBeInTheDocument();
    expect(screen.getByTestId("home-dashboard-skeleton").className).toContain("hidden");
    expect(screen.queryByTestId("home-dashboard")).not.toBeInTheDocument();
  });

  it("renders only the skeleton while auth loads when a session cookie exists", () => {
    setSessionCookie(true);
    render(<HomeContent initialHomeData={DATA} />);
    expect(screen.getByTestId("home-dashboard-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("home-landing")).not.toBeInTheDocument();
    expect(document.documentElement.hasAttribute(AUTH_HINT_ATTRIBUTE)).toBe(true);
  });

  it("renders the landing without skeleton for a logged-out visitor", () => {
    auth.state = { user: null, loading: false };
    render(<HomeContent initialHomeData={DATA} />);
    expect(screen.getByTestId("home-landing")).toBeInTheDocument();
    expect(screen.queryByTestId("home-dashboard-skeleton")).not.toBeInTheDocument();
  });

  it("clears a stale hint attribute once the cookie is gone", () => {
    document.documentElement.setAttribute(AUTH_HINT_ATTRIBUTE, "");
    auth.state = { user: null, loading: false };
    render(<HomeContent initialHomeData={DATA} />);
    expect(document.documentElement.hasAttribute(AUTH_HINT_ATTRIBUTE)).toBe(false);
  });

  it("switches to the dashboard once a user is resolved", () => {
    auth.state = { user: { id: "u1" }, loading: false };
    render(<HomeContent initialHomeData={DATA} />);
    expect(screen.getByTestId("home-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("home-landing")).not.toBeInTheDocument();
  });
});
