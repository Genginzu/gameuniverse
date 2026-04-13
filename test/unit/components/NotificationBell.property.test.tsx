import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import React from "react";
import { render, screen } from "@testing-library/react";

// Feature: notifications-system, Property 10: Affichage du badge et aria-label
// **Validates: Requirements 5.2, 5.3, 5.4, 10.1**

// Mock useNotifications hook
const mockUseNotifications = vi.fn();
vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: (...args: unknown[]) => mockUseNotifications(...args),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === "ariaLabel") return `Notifications, ${params?.count} unread`;
    return key;
  },
}));

vi.mock("@iconify/react", () => ({
  Icon: (props: Record<string, unknown>) =>
    React.createElement("span", { "data-icon": props.icon }),
}));

import { NotificationBell } from "@/components/shared/NotificationBell";

describe("NotificationBell Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderWithCount(count: number) {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: count,
      isLoading: false,
      error: null,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      mutate: vi.fn(),
    });
    return render(<NotificationBell />);
  }

  // Feature: notifications-system, Property 10: Affichage du badge et aria-label
  // **Validates: Requirements 5.2, 5.3, 5.4, 10.1**
  describe("Property 10: Affichage du badge et aria-label", () => {
    it("for any unreadCount 0-100, badge and aria-label follow the display rules", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (unreadCount) => {
          const { unmount } = renderWithCount(unreadCount);

          const button = screen.getByRole("button");

          // aria-label always includes the exact count
          expect(button).toHaveAttribute("aria-label", `Notifications, ${unreadCount} unread`);

          if (unreadCount === 0) {
            // No badge visible when count is 0
            const badge = button.querySelector("span.absolute");
            expect(badge).toBeNull();
          } else if (unreadCount <= 9) {
            // Badge shows exact number for 1-9
            const badge = button.querySelector("span.absolute");
            expect(badge).not.toBeNull();
            expect(badge!.textContent).toBe(String(unreadCount));
          } else {
            // Badge shows "9+" for > 9
            const badge = button.querySelector("span.absolute");
            expect(badge).not.toBeNull();
            expect(badge!.textContent).toBe("9+");
          }

          unmount();
        }),
        { numRuns: 100 }
      );
    });
  });
});
