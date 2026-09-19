import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/ui/lazy-image", () => ({
  LazyImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: (props: Record<string, unknown>) => <div data-testid="skeleton" {...props} />,
}));

const mockUseSWR = vi.fn();
vi.mock("swr", () => ({
  default: (key: string) => mockUseSWR(key),
}));

import { SubscriptionListTab } from "@/components/players/subscription/SubscriptionListTab";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

describe("SubscriptionListTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a skeleton while loading", () => {
    mockUseSWR.mockReturnValue({ data: undefined, isLoading: true });
    render(<SubscriptionListTab playerId={PLAYER_ID} variant="followers" />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("shows the empty state for followers when list is empty", () => {
    mockUseSWR.mockReturnValue({ data: { subscriptions: [] }, isLoading: false });
    render(<SubscriptionListTab playerId={PLAYER_ID} variant="followers" />);
    expect(screen.getByText("emptyFollowers")).toBeInTheDocument();
  });

  it("shows the empty state for following when list is empty", () => {
    mockUseSWR.mockReturnValue({ data: { subscriptions: [] }, isLoading: false });
    render(<SubscriptionListTab playerId={PLAYER_ID} variant="following" />);
    expect(screen.getByText("emptyFollowing")).toBeInTheDocument();
  });

  it("renders a card per entry with a profile link", () => {
    mockUseSWR.mockReturnValue({
      data: {
        subscriptions: [
          { id: "s1", createdAt: "", profile: { id: "p1", username: "bob", avatarUrl: null } },
          { id: "s2", createdAt: "", profile: { id: "p2", username: "alice", avatarUrl: null } },
        ],
      },
      isLoading: false,
    });
    render(<SubscriptionListTab playerId={PLAYER_ID} variant="followers" />);
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/players/p1", "/players/p2"]);
  });

  it("falls back to the unknown label when username is missing", () => {
    mockUseSWR.mockReturnValue({
      data: {
        subscriptions: [
          { id: "s1", createdAt: "", profile: { id: "p1", username: null, avatarUrl: null } },
        ],
      },
      isLoading: false,
    });
    render(<SubscriptionListTab playerId={PLAYER_ID} variant="following" />);
    expect(screen.getByText("unknownPlayer")).toBeInTheDocument();
  });
});
