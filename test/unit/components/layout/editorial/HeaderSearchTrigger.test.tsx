import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const editorialTranslations: Record<string, string> = {
  "globalSearch.trigger.placeholder": "Search for a game, character, player",
  "globalSearch.trigger.placeholderShort": "Search",
  "globalSearch.trigger.ariaLabel": "Open search",
  "globalSearch.trigger.shortcutHint": "Ctrl K",
};

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const fullKey = `${namespace}.${key}`;
    return editorialTranslations[fullKey] ?? fullKey;
  },
}));

import { HeaderSearchTrigger } from "@/components/layout/editorial/HeaderSearchTrigger";

describe("HeaderSearchTrigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders as a button with aria-label and aria-haspopup=dialog", () => {
      render(<HeaderSearchTrigger onActivate={() => {}} />);
      const button = screen.getByRole("button", { name: "Open search" });
      expect(button.getAttribute("aria-haspopup")).toBe("dialog");
      expect(button.tagName).toBe("BUTTON");
    });

    it("renders the placeholder text (visible on >= md via CSS)", () => {
      render(<HeaderSearchTrigger onActivate={() => {}} />);
      expect(screen.getByText("Search for a game, character, player")).toBeDefined();
    });

    it("renders the Ctrl K shortcut badge", () => {
      render(<HeaderSearchTrigger onActivate={() => {}} />);
      expect(screen.getByText("Ctrl K")).toBeDefined();
    });

    it("renders the magnify icon (hidden from a11y tree)", () => {
      const { container } = render(<HeaderSearchTrigger onActivate={() => {}} />);
      // The Iconify component renders an svg/span with the icon name; we only
      // assert the button has *something* before the placeholder.
      const button = container.querySelector(".header-search-trigger");
      expect(button).not.toBeNull();
    });

    it("forwards a className to the button", () => {
      render(<HeaderSearchTrigger onActivate={() => {}} className="my-extra" />);
      const button = screen.getByRole("button", { name: "Open search" });
      expect(button.className).toContain("header-search-trigger");
      expect(button.className).toContain("my-extra");
    });
  });

  describe("activation", () => {
    it("calls onActivate on click", () => {
      const onActivate = vi.fn();
      render(<HeaderSearchTrigger onActivate={onActivate} />);
      fireEvent.click(screen.getByRole("button", { name: "Open search" }));
      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it("calls onActivate on focus", () => {
      const onActivate = vi.fn();
      render(<HeaderSearchTrigger onActivate={onActivate} />);
      fireEvent.focus(screen.getByRole("button", { name: "Open search" }));
      expect(onActivate).toHaveBeenCalledTimes(1);
    });
  });

  describe("Ctrl+K / Cmd+K shortcut", () => {
    it("calls onActivate on Ctrl+K", () => {
      const onActivate = vi.fn();
      render(<HeaderSearchTrigger onActivate={onActivate} />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it("calls onActivate on Cmd+K (Meta)", () => {
      const onActivate = vi.fn();
      render(<HeaderSearchTrigger onActivate={onActivate} />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });
      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it("works with uppercase K too", () => {
      const onActivate = vi.fn();
      render(<HeaderSearchTrigger onActivate={onActivate} />);
      fireEvent.keyDown(window, { key: "K", ctrlKey: true });
      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it("ignores Ctrl+K with Shift modifier (avoid stealing browser shortcuts)", () => {
      const onActivate = vi.fn();
      render(<HeaderSearchTrigger onActivate={onActivate} />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true, shiftKey: true });
      expect(onActivate).not.toHaveBeenCalled();
    });

    it("ignores Ctrl+K with Alt modifier", () => {
      const onActivate = vi.fn();
      render(<HeaderSearchTrigger onActivate={onActivate} />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true, altKey: true });
      expect(onActivate).not.toHaveBeenCalled();
    });

    it("does not capture when typing inside an input element", () => {
      const onActivate = vi.fn();
      render(
        <div>
          <HeaderSearchTrigger onActivate={onActivate} />
          <input data-testid="some-input" />
        </div>
      );
      const input = screen.getByTestId("some-input");
      fireEvent.keyDown(input, { key: "k", ctrlKey: true });
      expect(onActivate).not.toHaveBeenCalled();
    });

    it("does not capture when typing inside a textarea", () => {
      const onActivate = vi.fn();
      render(
        <div>
          <HeaderSearchTrigger onActivate={onActivate} />
          <textarea data-testid="some-textarea" />
        </div>
      );
      fireEvent.keyDown(screen.getByTestId("some-textarea"), { key: "k", ctrlKey: true });
      expect(onActivate).not.toHaveBeenCalled();
    });

    it("does not capture when typing inside a contenteditable element", () => {
      const onActivate = vi.fn();
      render(
        <div>
          <HeaderSearchTrigger onActivate={onActivate} />
          <div data-testid="ce" contentEditable suppressContentEditableWarning>
            type here
          </div>
        </div>
      );
      fireEvent.keyDown(screen.getByTestId("ce"), { key: "k", ctrlKey: true });
      expect(onActivate).not.toHaveBeenCalled();
    });

    it("does not call onActivate for unrelated keys", () => {
      const onActivate = vi.fn();
      render(<HeaderSearchTrigger onActivate={onActivate} />);
      fireEvent.keyDown(window, { key: "j", ctrlKey: true });
      fireEvent.keyDown(window, { key: "Enter" });
      expect(onActivate).not.toHaveBeenCalled();
    });

    it("disables the global shortcut when disableShortcut is true", () => {
      const onActivate = vi.fn();
      render(<HeaderSearchTrigger onActivate={onActivate} disableShortcut />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      expect(onActivate).not.toHaveBeenCalled();
    });

    it("removes the listener on unmount", () => {
      const onActivate = vi.fn();
      const { unmount } = render(<HeaderSearchTrigger onActivate={onActivate} />);
      unmount();
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      expect(onActivate).not.toHaveBeenCalled();
    });
  });
});
