import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSearchOverlay } from "@/hooks/useSearchOverlay";

describe("useSearchOverlay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("starts with isOpen = false", () => {
      const { result } = renderHook(() => useSearchOverlay());
      expect(result.current.isOpen).toBe(false);
    });

    it("exposes open and close functions", () => {
      const { result } = renderHook(() => useSearchOverlay());
      expect(typeof result.current.open).toBe("function");
      expect(typeof result.current.close).toBe("function");
    });
  });

  describe("open / close", () => {
    it("open() sets isOpen to true", () => {
      const { result } = renderHook(() => useSearchOverlay());
      act(() => result.current.open());
      expect(result.current.isOpen).toBe(true);
    });

    it("close() sets isOpen to false", () => {
      const { result } = renderHook(() => useSearchOverlay());
      act(() => result.current.open());
      expect(result.current.isOpen).toBe(true);
      act(() => result.current.close());
      expect(result.current.isOpen).toBe(false);
    });

    it("calling open() multiple times keeps isOpen true", () => {
      const { result } = renderHook(() => useSearchOverlay());
      act(() => result.current.open());
      act(() => result.current.open());
      expect(result.current.isOpen).toBe(true);
    });

    it("calling close() when already closed keeps isOpen false", () => {
      const { result } = renderHook(() => useSearchOverlay());
      act(() => result.current.close());
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("Ctrl+K / Cmd+K shortcut (Exigence 9.10)", () => {
    it("Ctrl+K opens the overlay when closed", () => {
      const { result } = renderHook(() => useSearchOverlay());

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("Cmd+K opens the overlay when closed", () => {
      const { result } = renderHook(() => useSearchOverlay());

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("Ctrl+K toggles the overlay closed when open", () => {
      const { result } = renderHook(() => useSearchOverlay());

      act(() => result.current.open());
      expect(result.current.isOpen).toBe(true);

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("plain 'k' without modifier does not open the overlay", () => {
      const { result } = renderHook(() => useSearchOverlay());

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("Escape shortcut (Exigence 9.7)", () => {
    it("Escape closes the overlay when open", () => {
      const { result } = renderHook(() => useSearchOverlay());

      act(() => result.current.open());
      expect(result.current.isOpen).toBe(true);

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("Escape does nothing when overlay is already closed", () => {
      const { result } = renderHook(() => useSearchOverlay());

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("irrelevant keys", () => {
    it("random keys do not affect the overlay state", () => {
      const { result } = renderHook(() => useSearchOverlay());

      const keys = ["a", "Enter", "Tab", "ArrowDown", " "];
      for (const key of keys) {
        act(() => {
          document.dispatchEvent(new KeyboardEvent("keydown", { key }));
        });
        expect(result.current.isOpen).toBe(false);
      }
    });
  });

  describe("event listener cleanup", () => {
    it("removes keydown listener on unmount", () => {
      const addSpy = vi.spyOn(document, "addEventListener");
      const removeSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = renderHook(() => useSearchOverlay());

      expect(addSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

      unmount();

      expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });
});
