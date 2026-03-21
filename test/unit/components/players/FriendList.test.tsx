import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import type { FriendSummary } from "@/types/friendship";

// IntersectionObserver stub for jsdom
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
}
globalThis.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

vi.mock("next-intl", () => {
  const createTranslator = () => {
    const t = (key: string) => key;
    t.rich = (key: string) => key;
    t.raw = (key: string) => key;
    t.markup = (key: string) => key;
    t.has = () => true;
    return t;
  };
  return {
    useTranslations: () => createTranslator(),
    useLocale: () => "fr",
    useMessages: () => ({}),
    useFormatter: () => ({
      relativeTime: () => "il y a 2 heures",
      dateTime: () => "01/03/2024",
      number: (n: number) => String(n),
    }),
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/ui/lazy-image", () => ({
  LazyImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import { FriendList } from "@/components/players/friends/FriendList";

const makeFriend = (index: number): FriendSummary => ({
  id: `player-${index}`,
  friendshipId: `fs-${index}`,
  displayName: `Player ${index}`,
  avatarUrl: index % 2 === 0 ? `https://img.test/${index}.png` : null,
  level: index + 1,
  acceptedAt: `2024-03-0${index + 1}T12:00:00Z`,
});

const FRIENDS: FriendSummary[] = [makeFriend(0), makeFriend(1), makeFriend(2)];

const defaultProps = {
  friends: FRIENDS,
  isLoading: false,
  isLoadingMore: false,
  hasNextPage: false,
  onLoadMore: vi.fn(),
  locale: "fr",
};

describe("FriendList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders friend cards with role='list' and aria-label", () => {
    render(<FriendList {...defaultProps} />);
    const list = screen.getByRole("list");
    expect(list).toHaveAttribute("aria-label", "listLabel");
  });

  it("renders one listitem per friend", () => {
    render(<FriendList {...defaultProps} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
  });

  it("renders friend display names via FriendCard links", () => {
    render(<FriendList {...defaultProps} />);
    for (const friend of FRIENDS) {
      expect(screen.getByText(friend.displayName)).toBeInTheDocument();
    }
  });

  it("shows skeleton when isLoading is true", () => {
    render(<FriendList {...defaultProps} isLoading={true} friends={[]} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when friends array is empty", () => {
    render(<FriendList {...defaultProps} friends={[]} />);
    expect(screen.getByText("empty")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows loading-more skeletons when isLoadingMore is true", () => {
    render(<FriendList {...defaultProps} isLoadingMore={true} hasNextPage={true} />);
    // The list is still visible plus extra skeletons for loading more
    expect(screen.getByRole("list")).toBeInTheDocument();
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBe(3);
  });

  it("creates an IntersectionObserver for infinite scroll", () => {
    let observerInstance: MockIntersectionObserver | null = null;
    const OrigMock = MockIntersectionObserver;
    globalThis.IntersectionObserver = class extends OrigMock {
      constructor(cb: IntersectionObserverCallback) {
        super(cb);
        observerInstance = this;
      }
    } as unknown as typeof IntersectionObserver;

    render(<FriendList {...defaultProps} hasNextPage={true} />);
    expect(observerInstance).not.toBeNull();
    expect(observerInstance!.observe).toHaveBeenCalled();

    // Restore
    globalThis.IntersectionObserver = OrigMock as unknown as typeof IntersectionObserver;
  });
});
