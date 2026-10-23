import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

let unreadCount = 0;
let pendingCount = 0;

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({ unreadCount }),
}));
vi.mock("@/hooks/usePendingRequestCount", () => ({
  usePendingRequestCount: () => ({ count: pendingCount }),
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: { count: number }) =>
    `${key}:${params?.count ?? ""}`,
}));

import { NavCountBadge } from "@/components/layout/editorial/NavCountBadge";

describe("NavCountBadge", () => {
  beforeEach(() => {
    unreadCount = 0;
    pendingCount = 0;
  });

  it("shows the pending friend requests count for the pendingFriends badge", () => {
    pendingCount = 3;
    render(<NavCountBadge badge="pendingFriends" />);
    const badge = screen.getByLabelText("pendingFriendsBadge:3");
    expect(badge.textContent).toBe("3");
  });

  it("shows the unread notifications count for the unreadNotifications badge", () => {
    unreadCount = 12;
    render(<NavCountBadge badge="unreadNotifications" />);
    expect(screen.getByLabelText("unreadBadge:12").textContent).toBe("9+");
  });

  it("renders nothing when the count is zero", () => {
    const { container } = render(<NavCountBadge badge="pendingFriends" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for links without a counter", () => {
    pendingCount = 5;
    unreadCount = 5;
    const { container } = render(<NavCountBadge />);
    expect(container.firstChild).toBeNull();
  });
});
