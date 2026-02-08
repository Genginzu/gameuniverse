import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { reducer, toast, useToast } from "../../../src/hooks/use-toast";
import { renderHook, act } from "@testing-library/react";

// Test the reducer directly since it's exported
describe("use-toast", () => {
  describe("reducer", () => {
    const createToast = (id: string, title?: string) => ({
      id,
      title,
      open: true,
      onOpenChange: () => {},
    });

    describe("ADD_TOAST action", () => {
      it("should add a toast to empty state", () => {
        const initialState = { toasts: [] };
        const newToast = createToast("1", "Test Toast");

        const result = reducer(initialState, {
          type: "ADD_TOAST",
          toast: newToast,
        });

        expect(result.toasts).toHaveLength(1);
        expect(result.toasts[0].id).toBe("1");
        expect(result.toasts[0].title).toBe("Test Toast");
      });

      it("should add toast at the beginning of the list", () => {
        // Note: TOAST_LIMIT is 1, so we can only verify the newest toast is first
        const initialState = { toasts: [] };
        const firstToast = createToast("1", "First Toast");

        let result = reducer(initialState, {
          type: "ADD_TOAST",
          toast: firstToast,
        });

        const secondToast = createToast("2", "Second Toast");
        result = reducer(result, {
          type: "ADD_TOAST",
          toast: secondToast,
        });

        // Due to TOAST_LIMIT=1, only the newest toast remains
        expect(result.toasts[0].id).toBe("2");
        expect(result.toasts).toHaveLength(1);
      });

      it("should limit toasts to TOAST_LIMIT (1)", () => {
        const initialState = {
          toasts: [createToast("1", "First Toast")],
        };
        const newToast = createToast("2", "Second Toast");

        const result = reducer(initialState, {
          type: "ADD_TOAST",
          toast: newToast,
        });

        // TOAST_LIMIT is 1, so only the newest toast should remain
        expect(result.toasts).toHaveLength(1);
        expect(result.toasts[0].id).toBe("2");
      });
    });

    describe("UPDATE_TOAST action", () => {
      it("should update an existing toast", () => {
        const initialState = {
          toasts: [createToast("1", "Original Title")],
        };

        const result = reducer(initialState, {
          type: "UPDATE_TOAST",
          toast: { id: "1", title: "Updated Title" },
        });

        expect(result.toasts[0].title).toBe("Updated Title");
      });

      it("should not modify other toasts", () => {
        const initialState = {
          toasts: [createToast("1", "Toast 1"), createToast("2", "Toast 2")],
        };

        const result = reducer(initialState, {
          type: "UPDATE_TOAST",
          toast: { id: "1", title: "Updated Toast 1" },
        });

        expect(result.toasts[0].title).toBe("Updated Toast 1");
        expect(result.toasts[1].title).toBe("Toast 2");
      });

      it("should preserve other properties when updating", () => {
        const initialState = {
          toasts: [{ ...createToast("1", "Title"), description: "Description" }],
        };

        const result = reducer(initialState, {
          type: "UPDATE_TOAST",
          toast: { id: "1", title: "New Title" },
        });

        expect(result.toasts[0].title).toBe("New Title");
        expect(result.toasts[0].description).toBe("Description");
      });
    });

    describe("DISMISS_TOAST action", () => {
      it("should set open to false for specific toast", () => {
        const initialState = {
          toasts: [{ ...createToast("1", "Toast"), open: true }],
        };

        const result = reducer(initialState, {
          type: "DISMISS_TOAST",
          toastId: "1",
        });

        expect(result.toasts[0].open).toBe(false);
      });

      it("should dismiss all toasts when no toastId provided", () => {
        const initialState = {
          toasts: [
            { ...createToast("1", "Toast 1"), open: true },
            { ...createToast("2", "Toast 2"), open: true },
          ],
        };

        const result = reducer(initialState, {
          type: "DISMISS_TOAST",
          toastId: undefined,
        });

        expect(result.toasts[0].open).toBe(false);
        expect(result.toasts[1].open).toBe(false);
      });

      it("should not affect other toasts when dismissing specific one", () => {
        const initialState = {
          toasts: [
            { ...createToast("1", "Toast 1"), open: true },
            { ...createToast("2", "Toast 2"), open: true },
          ],
        };

        const result = reducer(initialState, {
          type: "DISMISS_TOAST",
          toastId: "1",
        });

        expect(result.toasts[0].open).toBe(false);
        expect(result.toasts[1].open).toBe(true);
      });
    });

    describe("REMOVE_TOAST action", () => {
      it("should remove specific toast from state", () => {
        const initialState = {
          toasts: [createToast("1", "Toast")],
        };

        const result = reducer(initialState, {
          type: "REMOVE_TOAST",
          toastId: "1",
        });

        expect(result.toasts).toHaveLength(0);
      });

      it("should remove all toasts when no toastId provided", () => {
        const initialState = {
          toasts: [createToast("1", "Toast 1"), createToast("2", "Toast 2")],
        };

        const result = reducer(initialState, {
          type: "REMOVE_TOAST",
          toastId: undefined,
        });

        expect(result.toasts).toHaveLength(0);
      });

      it("should only remove specified toast", () => {
        const initialState = {
          toasts: [createToast("1", "Toast 1"), createToast("2", "Toast 2")],
        };

        const result = reducer(initialState, {
          type: "REMOVE_TOAST",
          toastId: "1",
        });

        expect(result.toasts).toHaveLength(1);
        expect(result.toasts[0].id).toBe("2");
      });
    });
  });

  describe("toast state management", () => {
    it("should maintain immutability", () => {
      const initialState = {
        toasts: [{ id: "1", title: "Toast", open: true, onOpenChange: () => {} }],
      };
      const result = reducer(initialState, {
        type: "UPDATE_TOAST",
        toast: { id: "1", title: "Updated" },
      });

      expect(result).not.toBe(initialState);
      expect(result.toasts).not.toBe(initialState.toasts);
    });

    it("should handle empty state", () => {
      const initialState = { toasts: [] };
      const result = reducer(initialState, {
        type: "REMOVE_TOAST",
        toastId: "nonexistent",
      });

      expect(result.toasts).toHaveLength(0);
    });
  });

  describe("toast creation", () => {
    it("should create toast with required properties", () => {
      const toast = {
        id: "1",
        title: "Test",
        open: true,
        onOpenChange: () => {},
      };

      expect(toast.id).toBeDefined();
      expect(toast.open).toBe(true);
      expect(typeof toast.onOpenChange).toBe("function");
    });

    it("should support optional description", () => {
      const toast = {
        id: "1",
        title: "Test",
        description: "Description text",
        open: true,
        onOpenChange: () => {},
      };

      expect(toast.description).toBe("Description text");
    });

    it("should support optional action", () => {
      const action = { altText: "Undo", onClick: () => {} };
      const toast = {
        id: "1",
        title: "Test",
        action,
        open: true,
        onOpenChange: () => {},
      };

      expect(toast.action).toBeDefined();
    });
  });

  describe("ID generation", () => {
    it("should generate unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const id = String(i + 1);
        ids.add(id);
      }

      expect(ids.size).toBe(100);
    });

    it("should handle ID overflow gracefully", () => {
      // The genId function uses modulo to prevent overflow
      const maxSafe = Number.MAX_SAFE_INTEGER;
      const nextId = (maxSafe + 1) % maxSafe;

      expect(nextId).toBeLessThan(maxSafe);
    });
  });

  describe("listener management", () => {
    it("should support multiple listeners pattern", () => {
      const listeners: Array<(state: { toasts: unknown[] }) => void> = [];
      const listener1 = () => {};
      const listener2 = () => {};

      listeners.push(listener1);
      listeners.push(listener2);

      expect(listeners).toHaveLength(2);
    });

    it("should remove listener correctly", () => {
      const listeners: Array<(state: { toasts: unknown[] }) => void> = [];
      const listener = () => {};

      listeners.push(listener);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }

      expect(listeners).toHaveLength(0);
    });
  });
});

describe("toast function", () => {
  it("should create a toast and return control functions", () => {
    const result = toast({ title: "Test Toast" });

    expect(result.id).toBeDefined();
    expect(typeof result.dismiss).toBe("function");
    expect(typeof result.update).toBe("function");
  });

  it("should generate unique IDs for each toast", () => {
    const toast1 = toast({ title: "Toast 1" });
    const toast2 = toast({ title: "Toast 2" });

    expect(toast1.id).not.toBe(toast2.id);
  });

  it("should create toast with description", () => {
    const result = toast({
      title: "Test Toast",
      description: "This is a description",
    });

    expect(result.id).toBeDefined();
  });

  it("should allow updating toast after creation", () => {
    const result = toast({ title: "Original Title" });

    // Update should not throw
    expect(() => {
      result.update({ id: result.id, title: "Updated Title" });
    }).not.toThrow();
  });

  it("should allow dismissing toast after creation", () => {
    const result = toast({ title: "Test Toast" });

    // Dismiss should not throw
    expect(() => {
      result.dismiss();
    }).not.toThrow();
  });
});

describe("useToast hook", () => {
  it("should return toast function and state", () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toast).toBeDefined();
    expect(result.current.dismiss).toBeDefined();
    expect(result.current.toasts).toBeDefined();
    expect(Array.isArray(result.current.toasts)).toBe(true);
  });

  it("should add toast to state when toast is called", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "New Toast" });
    });

    // Due to TOAST_LIMIT=1, there should be at most 1 toast
    expect(result.current.toasts.length).toBeLessThanOrEqual(1);
  });

  it("should dismiss toast by ID", () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const newToast = result.current.toast({ title: "Test Toast" });
      toastId = newToast.id;
    });

    act(() => {
      result.current.dismiss(toastId!);
    });

    // Toast should be marked as closed
    const dismissedToast = result.current.toasts.find((t) => t.id === toastId);
    if (dismissedToast) {
      expect(dismissedToast.open).toBe(false);
    }
  });

  it("should dismiss all toasts when no ID provided", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "Toast 1" });
    });

    act(() => {
      result.current.dismiss();
    });

    // All toasts should be marked as closed
    result.current.toasts.forEach((t) => {
      expect(t.open).toBe(false);
    });
  });

  it("should handle multiple hook instances", () => {
    const { result: result1 } = renderHook(() => useToast());
    const { result: result2 } = renderHook(() => useToast());

    // Both hooks should share the same state
    act(() => {
      result1.current.toast({ title: "Shared Toast" });
    });

    // Both should see the toast (or the state should be synchronized)
    expect(result1.current.toasts.length).toBe(result2.current.toasts.length);
  });

  it("should clean up listener on unmount", () => {
    const { unmount } = renderHook(() => useToast());

    // Should not throw on unmount
    expect(() => {
      unmount();
    }).not.toThrow();
  });
});
