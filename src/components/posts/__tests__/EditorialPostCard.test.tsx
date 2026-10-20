import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import type { PostWithAuthor } from "@/types/post";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
  useFormatter: () => ({ relativeTime: () => "just now" }),
  useLocale: () => "fr",
}));

vi.mock("@iconify/react", () => ({
  Icon: ({ icon }: { icon: string }) => React.createElement("span", { "data-icon": icon }),
}));

vi.mock("@/components/players/posts/PostContentRenderer", () => ({
  PostContentRenderer: ({ content }: { content: string }) =>
    React.createElement("p", null, content),
}));

import { EditorialPostCard } from "@/components/posts/EditorialPostCard";

const BASE_POST: PostWithAuthor = {
  id: "post-1",
  playerId: "player-1",
  content: "GG everyone",
  imageUrl: null,
  tags: [],
  mentions: [],
  createdAt: "2026-10-01T10:00:00Z",
  updatedAt: "2026-10-01T10:00:00Z",
  authorName: "alice",
  authorAvatar: null,
};

describe("EditorialPostCard author", () => {
  it("shows the author name", () => {
    render(<EditorialPostCard post={BASE_POST} locale="fr" />);
    expect(screen.getByText("alice")).toBeTruthy();
  });

  it("labels an anonymised post as written by a deleted user", () => {
    const anonymised = { ...BASE_POST, playerId: null, authorName: null };
    render(<EditorialPostCard post={anonymised} locale="fr" />);
    expect(screen.getByText("accountDeletion.deletedUser")).toBeTruthy();
    expect(screen.getByText("GG everyone")).toBeTruthy();
  });
});
