import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

/**
 * Feature: navigation-sidebar, Task 6.4
 * Unit tests for MobileNavOverlay and MobileHamburgerButton.
 * Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6
 */

// --- Mocks ---

const mockUsePathname = vi.fn(() => "/dashboard");
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  Link: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => React.createElement("a", { href, onClick }, children),
}));

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => key,
}));

vi.mock("@/hooks/usePendingRequestCount", () => ({
  usePendingRequestCount: () => ({
    count: 0,
    isLoading: false,
    decrement: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import MobileNavOverlay from "@/components/layout/dashboard/MobileNavOverlay";
import MobileHamburgerButton from "@/components/layout/dashboard/MobileHamburgerButton";

// --- Tests ---

describe("MobileNavOverlay", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSearchOpen: vi.fn(),
    isAuthenticated: true,
    currentUserId: "user-123",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/dashboard");
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(<MobileNavOverlay {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders with role=dialog and aria-modal=true", () => {
    render(<MobileNavOverlay {...defaultProps} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("renders the search button", () => {
    render(<MobileNavOverlay {...defaultProps} />);
    expect(screen.getByText("search")).toBeInTheDocument();
  });

  it("calls onSearchOpen and onClose when search button is clicked", () => {
    render(<MobileNavOverlay {...defaultProps} />);
    fireEvent.click(screen.getByText("search"));
    expect(defaultProps.onSearchOpen).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("renders the 3 public links", () => {
    render(<MobileNavOverlay {...defaultProps} />);
    expect(screen.getByText("games")).toBeInTheDocument();
    expect(screen.getByText("characters")).toBeInTheDocument();
    expect(screen.getByText("players")).toBeInTheDocument();
  });

  it("renders the 6 main nav links when authenticated", () => {
    render(<MobileNavOverlay {...defaultProps} />);
    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.getByText("library")).toBeInTheDocument();
    expect(screen.getByText("myCharacters")).toBeInTheDocument();
    expect(screen.getByText("collections")).toBeInTheDocument();
    expect(screen.getByText("friends")).toBeInTheDocument();
    expect(screen.getByText("profile")).toBeInTheDocument();
  });

  it("does not render main nav links when not authenticated", () => {
    render(<MobileNavOverlay {...defaultProps} isAuthenticated={false} />);
    expect(screen.queryByText("dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("library")).not.toBeInTheDocument();
  });

  it("renders sign-in link when not authenticated", () => {
    render(<MobileNavOverlay {...defaultProps} isAuthenticated={false} />);
    expect(screen.getByText("login")).toBeInTheDocument();
  });

  it("calls onClose when a nav link is clicked", () => {
    render(<MobileNavOverlay {...defaultProps} />);
    fireEvent.click(screen.getByText("dashboard"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    render(<MobileNavOverlay {...defaultProps} />);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when the inner nav panel is clicked", () => {
    render(<MobileNavOverlay {...defaultProps} />);
    const nav = screen.getByRole("navigation");
    fireEvent.click(nav);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("renders a close button with accessible label", () => {
    render(<MobileNavOverlay {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Close navigation" })).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    render(<MobileNavOverlay {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Close navigation" }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});

describe("MobileHamburgerButton", () => {
  it("renders a button with accessible label", () => {
    render(<MobileHamburgerButton onClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Open navigation menu" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<MobileHamburgerButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
