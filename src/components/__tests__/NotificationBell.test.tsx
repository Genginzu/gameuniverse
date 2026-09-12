import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

// Mock useNotifications
const mockUseNotifications = vi.fn();
vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: (...args: unknown[]) => mockUseNotifications(...args),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === "ariaLabel") return `Notifications, ${params?.count} unread`;
    if (key === "noNotifications") return "No notifications";
    if (key === "markAllAsRead") return "Mark all as read";
    if (key === "typePostComment") return "commented on your post";
    if (key === "typeDiscussionMessage") return "sent you a message";
    if (key === "dismiss") return "Dismiss";
    return key;
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

// Mock window.matchMedia for NotificationDropdown's prefers-reduced-motion check
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

import { NotificationBell } from "@/components/shared/NotificationBell";

const defaultNotificationsReturn = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  mutate: vi.fn(),
};

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNotifications.mockReturnValue({ ...defaultNotificationsReturn });
  });

  // Req 5.5 — Not visible when not authenticated
  it("is not visible when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { container } = render(<NotificationBell />);
    expect(container.innerHTML).toBe("");
  });

  // Req 5.1 — Visible when authenticated
  it("is visible when user is authenticated", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    render(<NotificationBell />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  // Req 5.1 — Click opens dropdown
  it("opens dropdown on click", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    mockUseNotifications.mockReturnValue({
      ...defaultNotificationsReturn,
      unreadCount: 0,
    });
    render(<NotificationBell />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Dropdown should appear with role="menu"
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  // Req 5.4 — Badge not shown when count is 0
  it("does not show badge when unread count is 0", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    mockUseNotifications.mockReturnValue({
      ...defaultNotificationsReturn,
      unreadCount: 0,
    });
    render(<NotificationBell />);

    const button = screen.getByRole("button");
    const badge = button.querySelector("span.absolute");
    expect(badge).toBeNull();
  });

  // Req 5.2 — Badge shows count when 1-9
  it("shows badge with exact count when unread count is between 1 and 9", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    mockUseNotifications.mockReturnValue({
      ...defaultNotificationsReturn,
      unreadCount: 5,
    });
    render(<NotificationBell />);

    const button = screen.getByRole("button");
    const badge = button.querySelector("span.absolute");
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe("5");
  });

  // Req 5.3 — Badge shows "9+" when > 9
  it("shows badge with '9+' when unread count exceeds 9", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    mockUseNotifications.mockReturnValue({
      ...defaultNotificationsReturn,
      unreadCount: 15,
    });
    render(<NotificationBell />);

    const button = screen.getByRole("button");
    const badge = button.querySelector("span.absolute");
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe("9+");
  });

  // Req 10.1 — ARIA label includes exact count
  it("has aria-label with exact unread count", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    mockUseNotifications.mockReturnValue({
      ...defaultNotificationsReturn,
      unreadCount: 42,
    });
    render(<NotificationBell />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Notifications, 42 unread");
  });

  // Req 10.3 — Dropdown has role="menu"
  it("dropdown has ARIA role menu", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole("button"));
    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
  });
});
