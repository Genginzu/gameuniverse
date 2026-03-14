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

import { PostContentRenderer } from "@/components/players/PostContentRenderer";
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

  // Req 2.3, 2.7 — renders plain text without tags or mentions
  it("renders plain text content without tags or mentions", () => {
    render(<PostContentRenderer {...defaultProps} content="Hello world, just text" />);
    expect(screen.getByText("Hello world, just text")).toBeInTheDocument();
  });

  // Req 2.3, 2.7, 9.4 — renders tags as styled badges with aria-label
  it("renders tags as styled badges with aria-label", () => {
    render(<PostContentRenderer {...defaultProps} content="Check out #rpg" tags={["rpg"]} />);
    // The mock t("tagAriaLabel", { tag: "rpg" }) returns "tagAriaLabel" (key has no {tag} placeholder)
    const tag = screen.getByRole("button");
    expect(tag).toBeInTheDocument();
    expect(tag).toHaveTextContent("#rpg");
    expect(tag).toHaveAttribute("aria-label");
  });

  // Req 9.3 — tags have role="button" and tabIndex=0 (keyboard navigable)
  it("tags have role='button' and tabIndex=0 for keyboard navigation", () => {
    render(<PostContentRenderer {...defaultProps} content="Play #speedrun" tags={["speedrun"]} />);
    const tag = screen.getByRole("button");
    expect(tag).toHaveAttribute("role", "button");
    expect(tag).toHaveAttribute("tabindex", "0");
  });

  // Req 3.4 — renders valid mentions as links to player profile
  it("renders valid mentions as links to player profile", () => {
    const mentions: PostMention[] = [{ playerId: "uuid-123", username: "Alice" }];
    render(<PostContentRenderer {...defaultProps} content="Hello @Alice" mentions={mentions} />);
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/fr/players/uuid-123");
    expect(link).toHaveTextContent("@Alice");
  });

  // Req 9.4 — mentions have aria-label
  it("mentions have aria-label", () => {
    const mentions: PostMention[] = [{ playerId: "uuid-456", username: "Bob" }];
    render(<PostContentRenderer {...defaultProps} content="Hey @Bob" mentions={mentions} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-label");
  });

  // Req 3.5 — renders invalid mentions (not in mentions array) as plain text
  it("renders invalid mentions as plain text", () => {
    render(<PostContentRenderer {...defaultProps} content="Hello @Unknown" mentions={[]} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("@Unknown")).toBeInTheDocument();
  });

  // Req 2.3, 3.4, 3.5 — renders mixed content (text + tags + mentions)
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
    // Tag rendered as button
    const tagButton = screen.getByRole("button");
    expect(tagButton).toHaveTextContent("#rpg");
    // Valid mention rendered as link
    const mentionLink = screen.getByRole("link");
    expect(mentionLink).toHaveTextContent("@Charlie");
    expect(mentionLink).toHaveAttribute("href", "/fr/players/uuid-789");
    // Invalid mention rendered as plain text (no second link)
    expect(screen.getByText("@Nobody")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(1);
  });

  // Req 2.2 — tags are rendered in lowercase
  it("renders tags in lowercase", () => {
    render(<PostContentRenderer {...defaultProps} content="Check #RPG" tags={["rpg"]} />);
    const tag = screen.getByRole("button");
    expect(tag).toHaveTextContent("#rpg");
  });
});
