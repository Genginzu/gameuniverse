import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const labels: Record<string, string> = {
      typeFriendRequest: "sent you a friend request",
      typeFriendAccepted: "accepted your friend request",
      typeReviewVote: "voted on your review",
      typeAchievementUnlocked: "New achievement unlocked",
      typePostComment: "commented on your post",
      typePostMention: "mentioned you in a post",
      dismiss: "Dismiss",
    };
    return labels[key] ?? key;
  },
  useFormatter: () => ({
    relativeTime: () => "just now",
  }),
}));

vi.mock("@iconify/react", () => ({
  Icon: (props: Record<string, unknown>) =>
    React.createElement("span", {
      "data-testid": `icon-${props.icon}`,
      "data-icon": props.icon,
    }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, onClick, className }: Record<string, unknown>) =>
    React.createElement(
      "a",
      { href, onClick, className, "data-testid": "nav-link" },
      children as React.ReactNode
    ),
}));

import { NotificationItem } from "@/components/shared/NotificationItem";
import type { Notification } from "@/types/notification";

function makeNotification(
  type: Notification["type"],
  overrides: Partial<Notification> = {}
): Notification {
  return {
    id: "n1",
    recipientId: "rec-1",
    senderId: "sender-1",
    type,
    referenceId: "ref-1",
    contentPreview: "",
    isRead: false,
    createdAt: new Date().toISOString(),
    sender: { username: "Alice", avatarUrl: null },
    ...overrides,
  };
}

const mockDismiss = vi.fn();
const mockNavigate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NotificationItem — new notification types", () => {
  it("renders friend_request with correct icon and label", () => {
    render(
      <NotificationItem
        notification={makeNotification("friend_request")}
        onDismiss={mockDismiss}
        onNavigate={mockNavigate}
      />
    );
    expect(screen.getByTestId("icon-mdi:account-plus-outline")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("sent you a friend request")).toBeInTheDocument();
  });

  it("renders friend_accepted with correct icon and label", () => {
    render(
      <NotificationItem
        notification={makeNotification("friend_accepted")}
        onDismiss={mockDismiss}
        onNavigate={mockNavigate}
      />
    );
    expect(screen.getByTestId("icon-mdi:account-check-outline")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("accepted your friend request")).toBeInTheDocument();
  });

  it("renders review_vote with correct icon and label", () => {
    render(
      <NotificationItem
        notification={makeNotification("review_vote", { contentPreview: "helpful" })}
        onDismiss={mockDismiss}
        onNavigate={mockNavigate}
      />
    );
    expect(screen.getByTestId("icon-mdi:thumb-up-outline")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("voted on your review")).toBeInTheDocument();
  });

  it("renders achievement_unlocked as system notification without sender name", () => {
    render(
      <NotificationItem
        notification={makeNotification("achievement_unlocked", {
          senderId: "rec-1",
          contentPreview: "library_5",
          sender: { username: "Self", avatarUrl: null },
        })}
        onDismiss={mockDismiss}
        onNavigate={mockNavigate}
      />
    );
    expect(screen.getByTestId("icon-mdi:trophy-outline")).toBeInTheDocument();
    expect(screen.getByText("New achievement unlocked")).toBeInTheDocument();
    expect(screen.queryByText("Self")).not.toBeInTheDocument();
  });

  it("renders post_mention with correct icon and label", () => {
    render(
      <NotificationItem
        notification={makeNotification("post_mention", { contentPreview: "Check this out" })}
        onDismiss={mockDismiss}
        onNavigate={mockNavigate}
      />
    );
    expect(screen.getByTestId("icon-mdi:at")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("mentioned you in a post")).toBeInTheDocument();
  });

  it("hides content preview for friend_request and friend_accepted", () => {
    const { rerender } = render(
      <NotificationItem
        notification={makeNotification("friend_request", { contentPreview: "some text" })}
        onDismiss={mockDismiss}
      />
    );
    expect(screen.queryByText("some text")).not.toBeInTheDocument();

    rerender(
      <NotificationItem
        notification={makeNotification("friend_accepted", { contentPreview: "some text" })}
        onDismiss={mockDismiss}
      />
    );
    expect(screen.queryByText("some text")).not.toBeInTheDocument();
  });

  it("navigates to friends page for friend_request", () => {
    render(
      <NotificationItem
        notification={makeNotification("friend_request")}
        onDismiss={mockDismiss}
        onNavigate={mockNavigate}
      />
    );
    const link = screen.getByTestId("nav-link");
    expect(link.getAttribute("href")).toBe("/players/me/friends");
  });

  it("navigates to achievements page for achievement_unlocked", () => {
    render(
      <NotificationItem
        notification={makeNotification("achievement_unlocked")}
        onDismiss={mockDismiss}
        onNavigate={mockNavigate}
      />
    );
    const link = screen.getByTestId("nav-link");
    expect(link.getAttribute("href")).toBe("/players/me/achievements");
  });

  it("calls onDismiss when dismiss button clicked", () => {
    render(
      <NotificationItem
        notification={makeNotification("review_vote")}
        onDismiss={mockDismiss}
      />
    );
    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(mockDismiss).toHaveBeenCalledWith("n1");
  });
});
