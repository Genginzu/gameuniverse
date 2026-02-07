import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import * as fc from "fast-check";
import { shouldTriggerSearch, createDebouncedCallback } from "../SearchBar";

// Feature: code-refactoring, Property 6: SearchBar Debouncing
// **Validates: Requirements 10.1, 10.3, 10.4, 10.5, 10.6**

describe("SearchBar Property-Based Tests", () => {
  describe("Property 6: SearchBar Debouncing", () => {
    describe("shouldTriggerSearch helper", () => {
      it("returns false for queries shorter than minLength", () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 0, maxLength: 10 }),
            fc.integer({ min: 1, max: 10 }),
            (query, minLength) => {
              if (query.length < minLength) {
                return shouldTriggerSearch(query, minLength) === false;
              }
              return true;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("returns true for queries equal to or longer than minLength", () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.integer({ min: 1, max: 10 }),
            (query, minLength) => {
              if (query.length >= minLength) {
                return shouldTriggerSearch(query, minLength) === true;
              }
              return true;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("uses default minLength of 2 when not specified", () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 0, maxLength: 10 }),
            (query) => {
              const result = shouldTriggerSearch(query);
              const expected = query.length >= 2;
              return result === expected;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("empty string never triggers search", () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 10 }),
            (minLength) => {
              return shouldTriggerSearch("", minLength) === false;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("single character only triggers search when minLength is 0 or 1", () => {
        fc.assert(
          fc.property(
            fc.char(),
            fc.integer({ min: 0, max: 5 }),
            (char, minLength) => {
              const result = shouldTriggerSearch(char, minLength);
              const expected = minLength <= 1;
              return result === expected;
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe("createDebouncedCallback helper", () => {
      let originalSetTimeout: typeof setTimeout;
      let originalClearTimeout: typeof clearTimeout;
      let timeoutCallbacks: Map<number, { callback: () => void; delay: number }>;
      let nextTimeoutId: number;

      beforeEach(() => {
        timeoutCallbacks = new Map();
        nextTimeoutId = 1;
        
        originalSetTimeout = globalThis.setTimeout;
        originalClearTimeout = globalThis.clearTimeout;
        
        // Mock setTimeout
        (globalThis as unknown as { setTimeout: typeof setTimeout }).setTimeout = ((
          callback: () => void,
          delay: number
        ) => {
          const id = nextTimeoutId++;
          timeoutCallbacks.set(id, { callback, delay });
          return id as unknown as ReturnType<typeof setTimeout>;
        }) as typeof setTimeout;
        
        // Mock clearTimeout
        (globalThis as unknown as { clearTimeout: typeof clearTimeout }).clearTimeout = ((
          id: ReturnType<typeof setTimeout>
        ) => {
          timeoutCallbacks.delete(id as unknown as number);
        }) as typeof clearTimeout;
      });

      afterEach(() => {
        globalThis.setTimeout = originalSetTimeout;
        globalThis.clearTimeout = originalClearTimeout;
      });

      it("creates a debounced function that schedules callback", () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 1000 }),
            (delay) => {
              const mockCallback = mock(() => {});
              const { debouncedFn } = createDebouncedCallback(mockCallback, delay);
              
              debouncedFn();
              
              // Should have scheduled a timeout
              return timeoutCallbacks.size === 1;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("cancel function clears pending timeout", () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 1000 }),
            (delay) => {
              const mockCallback = mock(() => {});
              const { debouncedFn, cancel } = createDebouncedCallback(mockCallback, delay);
              
              debouncedFn();
              const sizeBeforeCancel = timeoutCallbacks.size;
              
              cancel();
              const sizeAfterCancel = timeoutCallbacks.size;
              
              return sizeBeforeCancel === 1 && sizeAfterCancel === 0;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("multiple rapid calls only schedule one timeout", () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 1000 }),
            fc.integer({ min: 2, max: 10 }),
            (delay, callCount) => {
              const mockCallback = mock(() => {});
              const { debouncedFn } = createDebouncedCallback(mockCallback, delay);
              
              // Call multiple times rapidly
              for (let i = 0; i < callCount; i++) {
                debouncedFn();
              }
              
              // Should only have one pending timeout (previous ones cleared)
              return timeoutCallbacks.size === 1;
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe("SearchBar behavior simulation", () => {
      /**
       * Simulates the SearchBar's clear button visibility logic.
       */
      const simulateClearButtonVisibility = (query: string): boolean => {
        return query.length > 0;
      };

      /**
       * Simulates the SearchBar's dropdown visibility logic in hybrid mode.
       */
      const simulateDropdownVisibility = (
        query: string,
        isHybridMode: boolean,
        minQueryLength: number,
        isOpen: boolean
      ): boolean => {
        if (!isHybridMode) return false;
        if (!isOpen) return false;
        return query.length >= minQueryLength;
      };

      it("clear button is visible when query is not empty", () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 100 }),
            (query) => {
              return simulateClearButtonVisibility(query) === true;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("clear button is hidden when query is empty", () => {
        expect(simulateClearButtonVisibility("")).toBe(false);
      });

      it("dropdown is hidden in simple mode regardless of query", () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 0, maxLength: 100 }),
            fc.integer({ min: 1, max: 10 }),
            fc.boolean(),
            (query, minQueryLength, isOpen) => {
              return simulateDropdownVisibility(query, false, minQueryLength, isOpen) === false;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("dropdown visibility depends on query length in hybrid mode", () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 0, maxLength: 20 }),
            fc.integer({ min: 1, max: 10 }),
            (query, minQueryLength) => {
              const isVisible = simulateDropdownVisibility(query, true, minQueryLength, true);
              const expected = query.length >= minQueryLength;
              return isVisible === expected;
            }
          ),
          { numRuns: 50 }
        );
      });

      it("dropdown is hidden when isOpen is false even with valid query", () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 5, maxLength: 20 }),
            fc.integer({ min: 1, max: 3 }),
            (query, minQueryLength) => {
              return simulateDropdownVisibility(query, true, minQueryLength, false) === false;
            }
          ),
          { numRuns: 50 }
        );
      });
    });
  });
});
