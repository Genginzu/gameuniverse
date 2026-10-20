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
  Link: ({ href, children, onClick }: Record<string, unknown>) =>
    React.createElement("a", { href, onClick }, children as React.ReactNode),
}));

import { NotificationCenterItem } from "@/components/notifications/NotificationCenterItem";
import type { Notification } from "@/types/notification";

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "n1",
    recipientId: "rec-1",
    senderId: "sender-1",
    type: "post_mention",
    referenceId: "post-1",
    contentPreview: "Hey @you",
    isRead: false,
    createdAt: new Date().toISOString(),
    sender: { username: "Alice", avatarUrl: null },
    ...overrides,
  };
}

const onToggleRead = vi.fn();

function renderItem(overrides: Partial<Notification> = {}) {
  return render(
    <NotificationCenterItem
      notification={makeNotification(overrides)}
      onToggleRead={onToggleRead}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NotificationCenterItem", () => {
  it("renders the presented fields and an unread marker", () => {
    const { container } = renderItem();
    expect(screen.getByTestId("icon-mdi:at")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("t:typePostMention")).toBeInTheDocument();
    expect(screen.getByText("Hey @you")).toBeInTheDocument();
    expect(container.firstElementChild?.getAttribute("data-unread")).toBe("true");
  });

  it("expands the preview when the row is clicked", () => {
    renderItem();
    const toggle = screen.getByRole("button", { expanded: false });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("is not expandable without a preview", () => {
    renderItem({ type: "friend_request", contentPreview: "ignored" });
    expect(screen.queryByText("ignored")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { expanded: false })).not.toBeInTheDocument();
  });

  it("marks as read when following the resource link", () => {
    renderItem();
    const link = screen.getByText("t:viewResource").closest("a")!;
    expect(link.getAttribute("href")).toBe("/players/sender-1?tab=activity");
    fireEvent.click(link);
    expect(onToggleRead).toHaveBeenCalledWith("n1", true);
  });

  it("toggles a read notification back to unread", () => {
    renderItem({ isRead: true });
    fireEvent.click(screen.getByText("t:markAsUnread"));
    expect(onToggleRead).toHaveBeenCalledWith("n1", false);
  });

  it("hides the resource link when there is no destination", () => {
    renderItem({ type: "moderation_warning", contentPreview: "" });
    expect(screen.queryByText("t:viewResource")).not.toBeInTheDocument();
  });
});
