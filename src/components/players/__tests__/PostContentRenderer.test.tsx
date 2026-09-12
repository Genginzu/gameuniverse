import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next-intl", () => {
  const createTranslator = () => {
    const t = (key: string, params?: Record<string, string>) => {
      if (params) {
        return Object.entries(params).reduce((acc, [k, v]) => acc.replace(`{${k}}`, v), key);
      }
      return key;
    };
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
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => React.createElement("a", { href, ...props }, children),
}));

import { PostContentRenderer } from "@/components/players/posts/PostContentRenderer";
import type { PostMention } from "@/types/post";

const defaultProps = {
  content: "",
  tags: [] as string[],
  mentions: [] as PostMention[],
  locale: "fr",
};

describe("PostContentRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders plain text content without tags or mentions", () => {
    render(<PostContentRenderer {...defaultProps} content="Hello world, just text" />);
    expect(screen.getByText("Hello world, just text")).toBeInTheDocument();
  });

  // Tags are now rendered as clickable links to /posts/tags/[tag]
  it("renders valid tags as clickable links to tag page", () => {
    render(<PostContentRenderer {...defaultProps} content="Check out #rpg" tags={["rpg"]} />);
    const tagLink = screen.getByRole("link");
    expect(tagLink).toHaveTextContent("#rpg");
    expect(tagLink).toHaveAttribute("href", "/posts/tags/rpg");
    expect(screen.getByText("Check out")).toBeInTheDocument();
  });

  it("renders unrecognized hashtags as plain text", () => {
    render(<PostContentRenderer {...defaultProps} content="Play #speedrun" tags={[]} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("#speedrun")).toBeInTheDocument();
  });

  it("renders valid mentions as links to player profile", () => {
    const mentions: PostMention[] = [{ playerId: "uuid-123", username: "Alice" }];
    render(<PostContentRenderer {...defaultProps} content="Hello @Alice" mentions={mentions} />);
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/players/uuid-123");
    expect(link).toHaveTextContent("@Alice");
  });

  it("mentions have aria-label", () => {
    const mentions: PostMention[] = [{ playerId: "uuid-456", username: "Bob" }];
    render(<PostContentRenderer {...defaultProps} content="Hey @Bob" mentions={mentions} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-label");
  });

  it("renders invalid mentions as plain text", () => {
    render(<PostContentRenderer {...defaultProps} content="Hello @Unknown" mentions={[]} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("@Unknown")).toBeInTheDocument();
  });

  it("renders mixed content with text, tags, and mentions correctly", () => {
    const mentions: PostMention[] = [{ playerId: "uuid-789", username: "Charlie" }];
    render(
      <PostContentRenderer
        {...defaultProps}
        content="Great #rpg session with @Charlie and @Nobody"
        tags={["rpg"]}
        mentions={mentions}
      />
    );
    const links = screen.getAllByRole("link");
    // Tag link + mention link = 2 links
    expect(links).toHaveLength(2);
    // Tag link
    const tagLink = links.find((l) => l.getAttribute("href")?.startsWith("/posts/tags/"));
    expect(tagLink).toHaveTextContent("#rpg");
    // Mention link
    const mentionLink = links.find((l) => l.getAttribute("href")?.startsWith("/players/"));
    expect(mentionLink).toHaveTextContent("@Charlie");
    expect(mentionLink).toHaveAttribute("href", "/players/uuid-789");
    // Invalid mention rendered as plain text
    expect(screen.getByText("@Nobody")).toBeInTheDocument();
  });

  // Tags are normalized to lowercase
  it("renders valid tags as links regardless of case", () => {
    render(<PostContentRenderer {...defaultProps} content="Check #RPG" tags={["rpg"]} />);
    const tagLink = screen.getByRole("link");
    expect(tagLink).toHaveTextContent("#rpg");
    expect(tagLink).toHaveAttribute("href", "/posts/tags/rpg");
  });
});
