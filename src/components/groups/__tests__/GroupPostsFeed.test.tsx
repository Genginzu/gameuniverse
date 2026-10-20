import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import type { GroupPost } from "@/types/group";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
  useLocale: () => "fr",
}));

vi.mock("@iconify/react", () => ({
  Icon: ({ icon }: { icon: string }) => React.createElement("span", { "data-icon": icon }),
}));

import { GroupPostsFeed } from "@/components/groups/GroupPostsFeed";

const POST_WITHOUT_PROFILE: GroupPost = {
  id: "post-1",
  groupId: "group-1",
  authorId: "gone-user",
  content: "Who is up for a raid tonight?",
  createdAt: "2026-10-01T10:00:00Z",
  updatedAt: "2026-10-01T10:00:00Z",
  author: { id: "gone-user", username: null, avatarUrl: null },
};

describe("GroupPostsFeed", () => {
  it("renders a post whose author profile no longer exists", () => {
    render(
      <GroupPostsFeed
        posts={[POST_WITHOUT_PROFILE]}
        canPost={false}
        isPosting={false}
        onCreatePost={vi.fn()}
      />
    );
    expect(screen.getByText("groups.posts.unknownAuthor")).toBeTruthy();
    expect(screen.getByText("Who is up for a raid tonight?")).toBeTruthy();
  });

  it("keeps the post of a deleted account under the deleted user label", () => {
    const anonymised: GroupPost = {
      ...POST_WITHOUT_PROFILE,
      authorId: null,
      author: { id: null, username: null, avatarUrl: null },
    };
    render(
      <GroupPostsFeed
        posts={[anonymised]}
        canPost={false}
        isPosting={false}
        onCreatePost={vi.fn()}
      />
    );
    expect(screen.getByText("accountDeletion.deletedUser")).toBeTruthy();
    expect(screen.getByText("Who is up for a raid tonight?")).toBeTruthy();
  });
});
