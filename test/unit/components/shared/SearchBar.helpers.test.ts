import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  shouldTriggerSearch,
  createDebouncedCallback,
} from "../../../../src/components/shared/SearchBar";

describe("SearchBar Helper Functions", () => {
  describe("shouldTriggerSearch", () => {
    describe("with default minLength (2)", () => {
      it("returns false for empty string", () => {
        expect(shouldTriggerSearch("")).toBe(false);
      });

      it("returns false for single character", () => {
        expect(shouldTriggerSearch("a")).toBe(false);
      });

      it("returns true for two characters", () => {
        expect(shouldTriggerSearch("ab")).toBe(true);
      });

      it("returns true for longer strings", () => {
        expect(shouldTriggerSearch("abc")).toBe(true);
        expect(shouldTriggerSearch("test query")).toBe(true);
      });

      it("returns false for whitespace only", () => {
        expect(shouldTriggerSearch(" ")).toBe(false);
      });

      it("returns true for two spaces", () => {
        expect(shouldTriggerSearch("  ")).toBe(true);
      });
    });

    describe("with custom minLength", () => {
      it("respects minLength of 1", () => {
        expect(shouldTriggerSearch("a", 1)).toBe(true);
        expect(shouldTriggerSearch("", 1)).toBe(false);
      });

      it("respects minLength of 3", () => {
        expect(shouldTriggerSearch("ab", 3)).toBe(false);
        expect(shouldTriggerSearch("abc", 3)).toBe(true);
      });

      it("respects minLength of 5", () => {
        expect(shouldTriggerSearch("test", 5)).toBe(false);
        expect(shouldTriggerSearch("tests", 5)).toBe(true);
      });

      it("respects minLength of 0", () => {
        expect(shouldTriggerSearch("", 0)).toBe(true);
      });
    });

    describe("edge cases", () => {
      it("handles unicode characters", () => {
        expect(shouldTriggerSearch("日本")).toBe(true);
        expect(shouldTriggerSearch("日")).toBe(false);
      });

      it("handles emoji", () => {
        expect(shouldTriggerSearch("🎮🎮")).toBe(true);
      });

      it("handles mixed content", () => {
        expect(shouldTriggerSearch("a1")).toBe(true);
        expect(shouldTriggerSearch("1")).toBe(false);
      });
    });
  });

  describe("createDebouncedCallback", () => {
    describe("basic functionality", () => {
      it("returns an object with debouncedFn and cancel", () => {
        const callback = vi.fn(() => {});
        const result = createDebouncedCallback(callback, 100);

        expect(typeof result.debouncedFn).toBe("function");
        expect(typeof result.cancel).toBe("function");
      });

      it("does not call callback immediately", () => {
        const callback = vi.fn(() => {});
        const { debouncedFn } = createDebouncedCallback(callback, 100);

        debouncedFn();

        expect(callback).not.toHaveBeenCalled();
      });

      it("calls callback after delay", async () => {
        const callback = vi.fn(() => {});
        const { debouncedFn } = createDebouncedCallback(callback, 50);

        debouncedFn();

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    describe("debouncing behavior", () => {
      it("resets timer on subsequent calls", async () => {
        const callback = vi.fn(() => {});
        const { debouncedFn } = createDebouncedCallback(callback, 50);

        debouncedFn();
        await new Promise((resolve) => setTimeout(resolve, 30));
        debouncedFn();
        await new Promise((resolve) => setTimeout(resolve, 30));
        debouncedFn();

        // Should not have been called yet
        expect(callback).not.toHaveBeenCalled();

        // Wait for final debounce
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(callback).toHaveBeenCalledTimes(1);
      });

      it("passes arguments to callback", async () => {
        const callback = vi.fn((arg: string) => arg);
        const { debouncedFn } = createDebouncedCallback(callback, 50);

        debouncedFn("test");

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(callback).toHaveBeenCalledWith("test");
      });

      it("uses last arguments when called multiple times", async () => {
        const callback = vi.fn((arg: string) => arg);
        const { debouncedFn } = createDebouncedCallback(callback, 50);

        debouncedFn("first");
        debouncedFn("second");
        debouncedFn("third");

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(callback).toHaveBeenCalledWith("third");
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    describe("cancel functionality", () => {
      it("prevents callback execution when cancelled", async () => {
        const callback = vi.fn(() => {});
        const { debouncedFn, cancel } = createDebouncedCallback(callback, 50);

        debouncedFn();
        cancel();

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(callback).not.toHaveBeenCalled();
      });

      it("can be called multiple times safely", () => {
        const callback = vi.fn(() => {});
        const { cancel } = createDebouncedCallback(callback, 50);

        // Should not throw
        cancel();
        cancel();
        cancel();
      });

      it("can cancel before any call", () => {
        const callback = vi.fn(() => {});
        const { cancel } = createDebouncedCallback(callback, 50);

        // Should not throw
        cancel();
      });
    });

    describe("timing variations", () => {
      it("works with very short delay", async () => {
        const callback = vi.fn(() => {});
        const { debouncedFn } = createDebouncedCallback(callback, 10);

        debouncedFn();

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(callback).toHaveBeenCalledTimes(1);
      });

      it("works with zero delay", async () => {
        const callback = vi.fn(() => {});
        const { debouncedFn } = createDebouncedCallback(callback, 0);

        debouncedFn();

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    describe("multiple instances", () => {
      it("maintains separate timers for different instances", async () => {
        const callback1 = vi.fn(() => {});
        const callback2 = vi.fn(() => {});

        const { debouncedFn: fn1 } = createDebouncedCallback(callback1, 50);
        const { debouncedFn: fn2 } = createDebouncedCallback(callback2, 100);

        fn1();
        fn2();

        await new Promise((resolve) => setTimeout(resolve, 75));

        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).not.toHaveBeenCalled();

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(callback2).toHaveBeenCalledTimes(1);
      });
    });
  });
});
