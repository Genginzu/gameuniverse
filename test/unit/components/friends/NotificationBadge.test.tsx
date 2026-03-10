import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next-intl", () => {
  const createTranslator = () => {
    const t = (key: string, params?: Record<string, unknown>) => {
      if (params) {
        return `${key} ${JSON.stringify(params)}`;
      }
      return key;
    };
    t.rich = (key: string) => key;
    t.raw = (key: string) => key;
    t.markup = (key: string) => key;
    t.has = () => true;
    return t;
  };
  return {
    useTranslations: () => createTranslator(),
  };
});

import { NotificationBadge, formatBadgeCount } from "@/components/friends/NotificationBadge";

describe("NotificationBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when count is 0", () => {
    const { container } = render(<NotificationBadge count={0} />);
    expect(container.innerHTML).toBe("");
  });

  it('renders "5" when count is 5', () => {
    render(<NotificationBadge count={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it('renders "9+" when count is 15', () => {
    render(<NotificationBadge count={15} />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it('renders "1" when count is 1 (singular)', () => {
    render(<NotificationBadge count={1} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("has correct aria-label containing the count", () => {
    render(<NotificationBadge count={5} />);
    const badge = screen.getByText("5");
    expect(badge).toHaveAttribute("aria-label", expect.stringContaining("5"));
    expect(badge).toHaveAttribute("aria-label", expect.stringContaining("pendingBadgeLabel"));
  });
});

describe("formatBadgeCount", () => {
  it("returns null for count 0", () => {
    expect(formatBadgeCount(0)).toBeNull();
  });

  it("returns null for negative count", () => {
    expect(formatBadgeCount(-3)).toBeNull();
  });

  it('returns "5" for count 5', () => {
    expect(formatBadgeCount(5)).toBe("5");
  });

  it('returns "9" for count 9', () => {
    expect(formatBadgeCount(9)).toBe("9");
  });

  it('returns "9+" for count 10', () => {
    expect(formatBadgeCount(10)).toBe("9+");
  });

  it('returns "9+" for count 15', () => {
    expect(formatBadgeCount(15)).toBe("9+");
  });
});
