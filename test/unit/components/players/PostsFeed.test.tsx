import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// IntersectionObserver stub for jsdom
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  constructor() {}
}
globalThis.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

const mockHookReturn = {
  posts: [] as Array<{
    id: string;
    playerId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }>,
  isLoading: false,
  isLoadingMore: false,
  isCreating: false,
  hasNextPage: false,
  error: null as string | null,
  loadMore: vi.fn(),
  createPost: vi.fn(),
  deletePost: vi.fn(),
};

const mockUsePlayerPosts = vi.fn(() => mockHookReturn);

vi.mock("@/hooks/usePlayerPosts", () => ({
  usePlayerPosts: (...args: unknown[]) => mockUsePlayerPosts(...args),
}));

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

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { PostsFeed } from "@/components/players/PostsFeed";

function setHookState(overrides: Partial<typeof mockHookReturn>) {
  mockUsePlayerPosts.mockReturnValue({ ...mockHookReturn, ...overrides });
}

describe("PostsFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlayerPosts.mockReturnValue({ ...mockHookReturn });
  });

  // Req 6.5 — empty state displayed when no posts and not loading
  it("shows empty state when no posts and not loading", () => {
    setHookState({ posts: [], isLoading: false });
    render(<PostsFeed playerId="player-1" locale="fr" isOwner={false} />);
    expect(screen.getByText("empty")).toBeInTheDocument();
  });

  // Req 6.4 — skeleton during loading
  it("shows skeleton during loading", () => {
    setHookState({ isLoading: true });
    const { container } = render(<PostsFeed playerId="player-1" locale="fr" isOwner={false} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // Req 7.1 — PostComposer visible when isOwner=true
  it("shows PostComposer when isOwner is true", () => {
    setHookState({ posts: [], isLoading: false });
    render(<PostsFeed playerId="player-1" locale="fr" isOwner={true} />);
    const textarea = screen.getByPlaceholderText("placeholder");
    expect(textarea).toBeInTheDocument();
  });

  // Req 7.8 — PostComposer hidden when isOwner=false
  it("hides PostComposer when isOwner is false", () => {
    setHookState({ posts: [], isLoading: false });
    render(<PostsFeed playerId="player-1" locale="fr" isOwner={false} />);
    expect(screen.queryByPlaceholderText("placeholder")).not.toBeInTheDocument();
  });

  // Req 11.3 — role="feed" present
  it("has role=feed on the feed container", () => {
    render(<PostsFeed playerId="player-1" locale="fr" isOwner={false} />);
    const feed = screen.getByRole("feed");
    expect(feed).toBeInTheDocument();
  });

  // Req 11.6 — aria-busy="false" when not loading
  it("sets aria-busy to false when not loading", () => {
    setHookState({ isLoading: false, isLoadingMore: false });
    render(<PostsFeed playerId="player-1" locale="fr" isOwner={false} />);
    expect(screen.getByRole("feed")).toHaveAttribute("aria-busy", "false");
  });

  // Req 11.6 — aria-busy="true" when loading
  it("sets aria-busy to true when loading", () => {
    setHookState({ isLoading: true });
    render(<PostsFeed playerId="player-1" locale="fr" isOwner={false} />);
    expect(screen.getByRole("feed")).toHaveAttribute("aria-busy", "true");
  });
});
