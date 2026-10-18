import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next-intl", () => {
  const createTranslator = () => {
    const t = (key: string) => key;
    t.rich = (key: string, values?: Record<string, unknown>) => {
      if (!values) return key;
      const nodes = Object.values(values).map((v) =>
        typeof v === "function" ? (v as (...args: unknown[]) => React.ReactNode)({}) : v
      );
      return React.createElement(React.Fragment, null, ...nodes);
    };
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

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/ui/lazy-image", () => ({
  LazyImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

import { FeedItem } from "@/components/players/feed/FeedItem";
import type { FeedEvent } from "@/types/feed";

const ACTOR = { id: "u1", username: "alice", avatarUrl: null };

describe("FeedItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders review event with actor and game link", () => {
    const event: FeedEvent = {
      id: "rev-1",
      type: "review",
      date: "2024-03-01T12:00:00Z",
      data: {
        type: "review",
        gameId: "g1",
        gameSlug: "zelda",
        gameName: "Zelda",
        rating: 18,
        contentExcerpt: "Excellent",
        actor: ACTOR,
      },
    };

    render(<FeedItem event={event} locale="fr" />);
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("Zelda")).toBeInTheDocument();
  });

  it("renders post event with content excerpt", () => {
    const event: FeedEvent = {
      id: "post-1",
      type: "post",
      date: "2024-03-02T12:00:00Z",
      data: {
        type: "post",
        postId: "p1",
        contentExcerpt: "Hello world!",
        actor: ACTOR,
      },
    };

    render(<FeedItem event={event} locale="fr" />);
    expect(screen.getByText("Hello world!")).toBeInTheDocument();
  });

  it("renders achievement event with name and icon", () => {
    const event: FeedEvent = {
      id: "ach-1",
      type: "achievement",
      date: "2024-03-03T12:00:00Z",
      data: {
        type: "achievement",
        achievementKey: "first_review",
        achievementName: "First Review",
        achievementIcon: "lucide:trophy",
        achievementDescription: "Write your first review",
        actor: ACTOR,
      },
    };

    render(<FeedItem event={event} locale="fr" />);
    expect(screen.getByText("First Review")).toBeInTheDocument();
    expect(screen.getByText("Write your first review")).toBeInTheDocument();
  });

  it("renders library event with game name", () => {
    const event: FeedEvent = {
      id: "lib-1",
      type: "library",
      date: "2024-03-04T12:00:00Z",
      data: {
        type: "library",
        gameId: "g2",
        gameSlug: "mario",
        gameName: "Super Mario",
        coverImage: null,
        status: "owned",
        actor: ACTOR,
      },
    };

    render(<FeedItem event={event} locale="fr" />);
    expect(screen.getByText("Super Mario")).toBeInTheDocument();
  });
});
