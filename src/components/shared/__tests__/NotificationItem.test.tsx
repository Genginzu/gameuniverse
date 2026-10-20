import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => `t:${key}`,
  useFormatter: () => ({ relativeTime: () => "just now" }),
}));

vi.mock("@iconify/react", () => ({
  Icon: (props: Record<string, unknown>) =>
    React.createElement("span", { "data-testid": `icon-${props.icon}` }),
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

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "n1",
    recipientId: "rec-1",
    senderId: "sender-1",
    type: "post_comment",
    referenceId: "post-1",
    contentPreview: "Great post",
    isRead: false,
    createdAt: new Date().toISOString(),
    sender: { username: "Alice", avatarUrl: null },
    ...overrides,
  };
}

const onDismiss = vi.fn();
const onNavigate = vi.fn();

function renderItem(overrides: Partial<Notification> = {}) {
  return render(
    <NotificationItem
      notification={makeNotification(overrides)}
      onDismiss={onDismiss}
      onNavigate={onNavigate}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NotificationItem", () => {
  it("renders the kind icon, sender, label, preview and relative date", () => {
    renderItem();
    expect(screen.getByTestId("icon-mdi:comment-outline")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("t:typePostComment")).toBeInTheDocument();
    expect(screen.getByText("Great post")).toBeInTheDocument();
    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it("omits the sender and raw payload for system notifications", () => {
    renderItem({ type: "achievement_unlocked", contentPreview: "library_5" });
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(screen.queryByText("library_5")).not.toBeInTheDocument();
    expect(screen.getByText("t:typeAchievementUnlocked")).toBeInTheDocument();
  });

  it("links to the resolved resource and dismisses on navigation", () => {
    renderItem();
    const link = screen.getByTestId("nav-link");
    expect(link.getAttribute("href")).toBe("/players/rec-1?tab=activity");
    fireEvent.click(link);
    expect(onDismiss).toHaveBeenCalledWith("n1");
    expect(onNavigate).toHaveBeenCalled();
  });

  it("renders a plain row when the notification has no destination", () => {
    renderItem({ type: "moderation_warning", contentPreview: "comment" });
    expect(screen.queryByTestId("nav-link")).not.toBeInTheDocument();
    expect(screen.getByText("t:moderationContentComment")).toBeInTheDocument();
  });

  it("calls onDismiss from the dismiss button", () => {
    renderItem();
    fireEvent.click(screen.getByLabelText("t:dismiss"));
    expect(onDismiss).toHaveBeenCalledWith("n1");
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
