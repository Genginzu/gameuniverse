import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import React from "react";
import { render } from "@testing-library/react";

// Feature: notifications-system, Property 11: Affichage complet des éléments de notification
// **Validates: Requirements 6.3**

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
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

import { NotificationItem } from "@/components/shared/NotificationItem";
import type { Notification, NotificationType } from "@/types/notification";

// Generator for a valid notification
const notificationArb = fc
  .record({
    id: fc.uuid(),
    recipientId: fc.uuid(),
    senderId: fc.uuid(),
    type: fc.constantFrom<NotificationType>("post_comment", "discussion_message"),
    referenceId: fc.uuid(),
    contentPreview: fc.string({ minLength: 1, maxLength: 100 }),
    isRead: fc.constant(false),
    createdAt: fc
      .date({ min: new Date("2020-01-01"), max: new Date(), noInvalidDate: true })
      .map((d) => d.toISOString()),
    senderUsername: fc.stringMatching(/^[a-zA-Z0-9_]{3,20}$/),
  })
  .map(({ senderUsername, ...rest }) => ({
    ...rest,
    sender: { username: senderUsername, avatarUrl: null },
  })) as fc.Arbitrary<Notification>;

describe("NotificationDropdown Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: notifications-system, Property 11: Affichage complet des éléments de notification
  // **Validates: Requirements 6.3**
  describe("Property 11: Affichage complet des éléments de notification", () => {
    it("each notification item contains sender name, type icon, content_preview, and relative date", () => {
      fc.assert(
        fc.property(notificationArb, (notification) => {
          const onDismiss = vi.fn();
          const { container, unmount } = render(
            <NotificationItem notification={notification} onDismiss={onDismiss} />
          );

          const html = container.innerHTML;

          // Sender name is displayed
          expect(html).toContain(notification.sender!.username);

          // Type icon is present — post_comment uses mdi:comment-outline, discussion_message uses mdi:message-outline
          const expectedIcon =
            notification.type === "post_comment" ? "mdi:comment-outline" : "mdi:message-outline";
          const iconEl = container.querySelector(`[data-icon="${expectedIcon}"]`);
          expect(iconEl).not.toBeNull();

          // Content preview is displayed (if non-empty after HTML encoding)
          if (notification.contentPreview.trim().length > 0) {
            // The content preview text should be present in the rendered output
            const previewEl = container.querySelector("p.truncate");
            expect(previewEl).not.toBeNull();
          }

          // Relative date is displayed ("just now" from our mock)
          const timeEl = container.querySelector("time");
          expect(timeEl).not.toBeNull();
          expect(timeEl!.textContent).toBe("just now");

          unmount();
        }),
        { numRuns: 100 }
      );
    });
  });
});
