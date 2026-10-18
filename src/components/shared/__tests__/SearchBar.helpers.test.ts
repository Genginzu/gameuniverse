import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { shouldTriggerSearch, createDebouncedCallback } from "@/components/shared/SearchBar";

describe("SearchBar Helper Functions", () => {
  describe("shouldTriggerSearch", () => {
    it.each([
      ["", false],
      ["a", false],
      [" ", false],
      ["ab", true],
      ["  ", true],
      ["test query", true],
      ["日", false],
      ["日本", true],
      ["🎮🎮", true],
      ["1", false],
      ["a1", true],
    ])("with the default minLength, %j -> %s", (query, expected) => {
      expect(shouldTriggerSearch(query)).toBe(expected);
    });

    it.each([
      ["", 0, true],
      ["", 1, false],
      ["a", 1, true],
      ["ab", 3, false],
      ["abc", 3, true],
      ["test", 5, false],
      ["tests", 5, true],
    ])("%j with minLength %i -> %s", (query, minLength, expected) => {
      expect(shouldTriggerSearch(query, minLength)).toBe(expected);
    });
  });

  describe("createDebouncedCallback", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("calls the callback once, only after the delay", () => {
      const callback = vi.fn();
      const { debouncedFn } = createDebouncedCallback(callback, 50);

      debouncedFn();
      vi.advanceTimersByTime(49);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("restarts the timer on every call and uses the last arguments", () => {
      const callback = vi.fn((arg: string) => arg);
      const { debouncedFn } = createDebouncedCallback(callback, 50);

      debouncedFn("first");
      vi.advanceTimersByTime(30);
      debouncedFn("second");
      vi.advanceTimersByTime(30);
      debouncedFn("third");
      vi.advanceTimersByTime(49);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("third");
    });

    it("fires on the next tick with a zero delay", () => {
      const callback = vi.fn();
      const { debouncedFn } = createDebouncedCallback(callback, 0);

      debouncedFn();
      expect(callback).not.toHaveBeenCalled();
      vi.advanceTimersByTime(0);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("cancel drops a pending call", () => {
      const callback = vi.fn();
      const { debouncedFn, cancel } = createDebouncedCallback(callback, 50);

      debouncedFn();
      cancel();
      vi.runAllTimers();
      expect(callback).not.toHaveBeenCalled();
    });

    it("cancel is a no-op when nothing is pending, and the debouncer keeps working", () => {
      const callback = vi.fn();
      const { debouncedFn, cancel } = createDebouncedCallback(callback, 50);

      expect(() => {
        cancel();
        cancel();
      }).not.toThrow();

      debouncedFn();
      vi.advanceTimersByTime(50);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("keeps independent timers per instance", () => {
      const fast = vi.fn();
      const slow = vi.fn();
      createDebouncedCallback(fast, 50).debouncedFn();
      createDebouncedCallback(slow, 100).debouncedFn();

      vi.advanceTimersByTime(75);
      expect(fast).toHaveBeenCalledTimes(1);
      expect(slow).not.toHaveBeenCalled();

      vi.advanceTimersByTime(25);
      expect(slow).toHaveBeenCalledTimes(1);
    });
  });
});
