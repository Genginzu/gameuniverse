import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import UnreadBadge from "@/components/discussions/UnreadBadge";

/**
 * Feature: player-discussions, Property 1: Unread badge displays correct count
 *
 * _For any_ non-negative integer `count`, the UnreadBadge component should render
 * the exact number when `count <= 99`, and render "99+" when `count > 99`.
 * When `count` is 0, the badge should not be visible.
 *
 * **Validates: Requirements 1.4, 1.5, 2.3**
 */

describe("UnreadBadge Property-Based Tests", () => {
  describe("Feature: player-discussions, Property 1: Unread badge displays correct count", () => {
    it("does not render when count is 0", () => {
      fc.assert(
        fc.property(fc.constant(0), (count) => {
          const { container, unmount } = render(<UnreadBadge count={count} />);
          expect(screen.queryByTestId("unread-badge")).not.toBeInTheDocument();
          expect(container.innerHTML).toBe("");
          unmount();
          cleanup();
        }),
        { numRuns: 100 }
      );
    });

    it("displays exact count for values 1–99", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 99 }), (count) => {
          const { unmount } = render(<UnreadBadge count={count} />);
          const badge = screen.getByTestId("unread-badge");
          expect(badge).toBeInTheDocument();
          expect(badge.textContent).toBe(String(count));
          unmount();
          cleanup();
        }),
        { numRuns: 100 }
      );
    });

    it("displays '99+' for any count greater than 99", () => {
      fc.assert(
        fc.property(fc.integer({ min: 100, max: 100_000 }), (count) => {
          const { unmount } = render(<UnreadBadge count={count} />);
          const badge = screen.getByTestId("unread-badge");
          expect(badge).toBeInTheDocument();
          expect(badge.textContent).toBe("99+");
          unmount();
          cleanup();
        }),
        { numRuns: 100 }
      );
    });

    it("has aria-label with actual count for accessibility", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100_000 }), (count) => {
          const { unmount } = render(<UnreadBadge count={count} />);
          const badge = screen.getByTestId("unread-badge");
          expect(badge.getAttribute("aria-label")).toBe(`${count} unread`);
          unmount();
          cleanup();
        }),
        { numRuns: 100 }
      );
    });
  });
});
