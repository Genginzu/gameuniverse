import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

/**
 * Feature: navigation-sidebar, Task 4.5
 * Unit tests for SearchOverlay component — verifies open/close behavior,
 * ARIA attributes, and initial focus on the search input.
 * Validates: Requirements 9.2, 9.7, 9.8, 9.9, 9.11, 9.12
 */

// Mock i18n navigation
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

// Mock useGlobalSearch hook
const mockSetQuery = vi.fn();
const mockSetDropdownOpen = vi.fn();
const mockSearchKeyDown = vi.fn();

vi.mock("@/hooks/useGlobalSearch", () => ({
  useGlobalSearch: () => ({
    query: "",
    setQuery: mockSetQuery,
    results: null,
    isLoading: false,
    isOpen: false,
    setIsOpen: mockSetDropdownOpen,
    activeIndex: -1,
    flatItems: [],
    handleKeyDown: mockSearchKeyDown,
  }),
}));

// Mock GlobalSearchDropdown
vi.mock("@/components/shared/GlobalSearchDropdown", () => ({
  GlobalSearchDropdown: () =>
    React.createElement("div", { "data-testid": "search-dropdown" }, "Search results"),
}));

// Mock global-search-utils
vi.mock("@/lib/utils/global-search-utils", () => ({
  getResultUrl: vi.fn(() => null),
}));

import SearchOverlay from "@/components/layout/dashboard/SearchOverlay";

describe("SearchOverlay", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  describe("Rendering when closed (Req 9.2)", () => {
    it("renders nothing when isOpen is false", () => {
      const { container } = render(<SearchOverlay isOpen={false} onClose={mockOnClose} />);
      expect(container.innerHTML).toBe("");
    });
  });

  describe("Rendering when open (Req 9.2)", () => {
    it("renders the overlay when isOpen is true", () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("renders a search input", () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  describe("ARIA attributes (Req 9.11)", () => {
    it("has role=dialog and aria-modal=true", () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("has an aria-label on the dialog", () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-label");
      expect(dialog.getAttribute("aria-label")).toBeTruthy();
    });

    it("has aria-autocomplete=list on the input", () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);
      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("aria-autocomplete", "list");
    });
  });

  describe("Focus initial (Req 9.12)", () => {
    it("focuses the search input when opened", () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);
      // The component uses a 50ms setTimeout for focus
      vi.advanceTimersByTime(100);
      const input = screen.getByRole("combobox");
      expect(document.activeElement).toBe(input);
    });
  });

  describe("Close on Escape (Req 9.7)", () => {
    it("calls onClose when Escape is pressed on the input", () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);
      const input = screen.getByRole("combobox");
      fireEvent.keyDown(input, { key: "Escape" });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Close on backdrop click (Req 9.8, 9.9)", () => {
    it("calls onClose when clicking the backdrop", () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);
      const dialog = screen.getByRole("dialog");
      // Click directly on the backdrop (the dialog element itself)
      fireEvent.click(dialog);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("does not close when clicking inside the panel", () => {
      render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);
      const input = screen.getByRole("combobox");
      fireEvent.click(input);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Search state reset on close", () => {
    it("resets query and dropdown when overlay closes", () => {
      const { rerender } = render(<SearchOverlay isOpen={true} onClose={mockOnClose} />);
      rerender(<SearchOverlay isOpen={false} onClose={mockOnClose} />);
      expect(mockSetQuery).toHaveBeenCalledWith("");
      expect(mockSetDropdownOpen).toHaveBeenCalledWith(false);
    });
  });
});
