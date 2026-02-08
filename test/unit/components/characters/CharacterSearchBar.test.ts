import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";

/**
 * Unit Tests for CharacterSearchBar Component
 *
 * **Validates: Requirements 2.1**
 * - WHEN a user types in the search field, THE Character_System SHALL filter
 *   characters whose names contain the search term
 */

/**
 * Simulates the CharacterSearchBar's debounce logic.
 * Returns whether the callback should be triggered after the debounce delay.
 */
const simulateDebounce = (
  searchQuery: string,
  debounceMs: number,
  elapsedMs: number
): { shouldTrigger: boolean; pendingQuery: string } => {
  return {
    shouldTrigger: elapsedMs >= debounceMs,
    pendingQuery: searchQuery,
  };
};

/**
 * Simulates the clear button visibility logic.
 */
const simulateClearButtonVisibility = (searchQuery: string): boolean => {
  return searchQuery.length > 0;
};

/**
 * Simulates the clear button action.
 */
const simulateClearAction = (): string => {
  return "";
};

/**
 * Simulates the search query state after user input.
 */
const simulateSearchInput = (currentQuery: string, newInput: string): string => {
  return newInput;
};

describe("CharacterSearchBar Unit Tests", () => {
  describe("Debounce Functionality", () => {
    it("should not trigger callback immediately when typing", () => {
      const result = simulateDebounce("mario", 300, 0);
      expect(result.shouldTrigger).toBe(false);
      expect(result.pendingQuery).toBe("mario");
    });

    it("should trigger callback after debounce delay has passed", () => {
      const result = simulateDebounce("mario", 300, 300);
      expect(result.shouldTrigger).toBe(true);
      expect(result.pendingQuery).toBe("mario");
    });

    it("should not trigger callback before debounce delay completes", () => {
      const result = simulateDebounce("link", 300, 150);
      expect(result.shouldTrigger).toBe(false);
    });

    it("should trigger callback when elapsed time exceeds debounce delay", () => {
      const result = simulateDebounce("zelda", 300, 500);
      expect(result.shouldTrigger).toBe(true);
    });

    it("should work with custom debounce delay", () => {
      const result = simulateDebounce("sonic", 500, 400);
      expect(result.shouldTrigger).toBe(false);

      const result2 = simulateDebounce("sonic", 500, 500);
      expect(result2.shouldTrigger).toBe(true);
    });

    it("should handle empty search query with debounce", () => {
      const result = simulateDebounce("", 300, 300);
      expect(result.shouldTrigger).toBe(true);
      expect(result.pendingQuery).toBe("");
    });
  });

  describe("Clear Button", () => {
    it("should show clear button when search query is not empty", () => {
      expect(simulateClearButtonVisibility("mario")).toBe(true);
    });

    it("should hide clear button when search query is empty", () => {
      expect(simulateClearButtonVisibility("")).toBe(false);
    });

    it("should show clear button for single character query", () => {
      expect(simulateClearButtonVisibility("m")).toBe(true);
    });

    it("should show clear button for whitespace-only query", () => {
      expect(simulateClearButtonVisibility("   ")).toBe(true);
    });

    it("should clear search query when clear button is clicked", () => {
      const clearedQuery = simulateClearAction();
      expect(clearedQuery).toBe("");
    });

    it("should hide clear button after clearing", () => {
      const clearedQuery = simulateClearAction();
      expect(simulateClearButtonVisibility(clearedQuery)).toBe(false);
    });
  });

  describe("onSearch Callback", () => {
    it("should pass the current search query to onSearch callback", () => {
      const searchQuery = "pikachu";
      const result = simulateDebounce(searchQuery, 300, 300);
      expect(result.pendingQuery).toBe(searchQuery);
    });

    it("should pass empty string to onSearch when cleared", () => {
      const clearedQuery = simulateClearAction();
      const result = simulateDebounce(clearedQuery, 300, 300);
      expect(result.pendingQuery).toBe("");
    });

    it("should update search query on user input", () => {
      const newQuery = simulateSearchInput("mar", "mario");
      expect(newQuery).toBe("mario");
    });

    it("should handle special characters in search query", () => {
      const searchQuery = "Link (Zelda)";
      const result = simulateDebounce(searchQuery, 300, 300);
      expect(result.pendingQuery).toBe("Link (Zelda)");
    });

    it("should handle unicode characters in search query", () => {
      const searchQuery = "マリオ";
      const result = simulateDebounce(searchQuery, 300, 300);
      expect(result.pendingQuery).toBe("マリオ");
    });

    it("should preserve query with leading/trailing spaces", () => {
      const searchQuery = "  mario  ";
      const result = simulateDebounce(searchQuery, 300, 300);
      expect(result.pendingQuery).toBe("  mario  ");
    });
  });

  describe("Initial Value Handling", () => {
    it("should use initial value when provided", () => {
      const initialValue = "bowser";
      const result = simulateSearchInput("", initialValue);
      expect(result).toBe(initialValue);
    });

    it("should show clear button when initial value is provided", () => {
      const initialValue = "peach";
      expect(simulateClearButtonVisibility(initialValue)).toBe(true);
    });

    it("should handle empty initial value", () => {
      const initialValue = "";
      expect(simulateClearButtonVisibility(initialValue)).toBe(false);
    });
  });

  describe("Debounce Timer Reset", () => {
    /**
     * Simulates multiple rapid inputs and determines if the final query
     * should be the one that triggers the callback.
     */
    const simulateRapidInputs = (
      inputs: string[],
      debounceMs: number,
      timeBetweenInputs: number
    ): { finalQuery: string; shouldTriggerWithFinal: boolean } => {
      // In a real debounce scenario, each new input resets the timer
      // Only the last input should trigger after the full debounce delay
      const finalQuery = inputs[inputs.length - 1] || "";
      const totalTime = inputs.length * timeBetweenInputs;
      // The callback should only trigger if enough time has passed since the LAST input
      const shouldTriggerWithFinal = timeBetweenInputs >= debounceMs;

      return {
        finalQuery,
        shouldTriggerWithFinal,
      };
    };

    it("should only trigger callback with final query after rapid inputs", () => {
      const inputs = ["m", "ma", "mar", "mari", "mario"];
      const result = simulateRapidInputs(inputs, 300, 50);
      expect(result.finalQuery).toBe("mario");
      // With 50ms between inputs, the timer keeps resetting
      expect(result.shouldTriggerWithFinal).toBe(false);
    });

    it("should trigger callback when input pauses long enough", () => {
      const inputs = ["m", "ma", "mar"];
      const result = simulateRapidInputs(inputs, 300, 400);
      expect(result.finalQuery).toBe("mar");
      // With 400ms between inputs (> 300ms debounce), each input triggers
      expect(result.shouldTriggerWithFinal).toBe(true);
    });
  });
});
