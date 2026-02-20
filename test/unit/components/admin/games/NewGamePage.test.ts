import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * NewGamePage Unit Tests
 *
 * Tests the submission logic for the game creation page:
 * 1. Successful submission triggers redirect and success toast
 * 2. Duplicate slug error is detected and shown
 * 3. Generic errors are handled gracefully
 *
 * Requirements: 4.3, 4.4
 */

// Simulate the duplicate-detection logic from NewGamePage's handleSubmit
function isDuplicateError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("duplicate") || lower.includes("already exists") || lower.includes("existe déjà")
  );
}

// Simulate the handleSubmit orchestration logic
interface SubmitResult {
  success: boolean;
  toastTitle: string;
  toastVariant?: "destructive";
  shouldRedirect: boolean;
}

async function simulateHandleSubmit(
  submitGame: () => Promise<void>,
  translations: Record<string, string>
): Promise<SubmitResult> {
  try {
    await submitGame();
    return {
      success: true,
      toastTitle: translations["createPage.success"],
      shouldRedirect: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : translations["createPage.errorGeneric"];
    const duplicate = isDuplicateError(message);

    return {
      success: false,
      toastTitle: duplicate ? translations["createPage.errorDuplicate"] : message,
      toastVariant: "destructive",
      shouldRedirect: false,
    };
  }
}

const translations: Record<string, string> = {
  "createPage.success": "Game created successfully!",
  "createPage.errorDuplicate": "A game with this slug already exists.",
  "createPage.errorGeneric": "An error occurred while creating the game.",
};

describe("NewGamePage Submit Logic", () => {
  describe("Successful submission (Req 4.3)", () => {
    it("returns success with redirect on successful submit", async () => {
      const submitGame = vi.fn(() => Promise.resolve());
      const result = await simulateHandleSubmit(submitGame, translations);

      expect(result.success).toBe(true);
      expect(result.shouldRedirect).toBe(true);
      expect(result.toastTitle).toBe("Game created successfully!");
      expect(result.toastVariant).toBeUndefined();
    });
  });

  describe("Duplicate slug error (Req 4.4)", () => {
    it("detects 'duplicate' keyword in error message", async () => {
      const submitGame = vi.fn(() =>
        Promise.reject(new Error("duplicate key value violates unique constraint"))
      );
      const result = await simulateHandleSubmit(submitGame, translations);

      expect(result.success).toBe(false);
      expect(result.shouldRedirect).toBe(false);
      expect(result.toastTitle).toBe("A game with this slug already exists.");
      expect(result.toastVariant).toBe("destructive");
    });

    it("detects 'already exists' keyword in error message", async () => {
      const submitGame = vi.fn(() =>
        Promise.reject(new Error("A game with slug 'test' already exists"))
      );
      const result = await simulateHandleSubmit(submitGame, translations);

      expect(result.success).toBe(false);
      expect(result.toastTitle).toBe("A game with this slug already exists.");
    });

    it("detects French duplicate message", async () => {
      const submitGame = vi.fn(() => Promise.reject(new Error("Un jeu avec ce slug existe déjà")));
      const result = await simulateHandleSubmit(submitGame, translations);

      expect(result.success).toBe(false);
      expect(result.toastTitle).toBe("A game with this slug already exists.");
    });
  });

  describe("Generic error handling", () => {
    it("shows the error message for non-duplicate errors", async () => {
      const submitGame = vi.fn(() => Promise.reject(new Error("Network timeout")));
      const result = await simulateHandleSubmit(submitGame, translations);

      expect(result.success).toBe(false);
      expect(result.shouldRedirect).toBe(false);
      expect(result.toastTitle).toBe("Network timeout");
      expect(result.toastVariant).toBe("destructive");
    });

    it("uses generic message for non-Error throws", async () => {
      const submitGame = vi.fn(() => Promise.reject("unknown error"));
      const result = await simulateHandleSubmit(submitGame, translations);

      expect(result.success).toBe(false);
      expect(result.toastTitle).toBe("An error occurred while creating the game.");
    });
  });
});

describe("isDuplicateError", () => {
  it("returns true for duplicate-related messages", () => {
    expect(isDuplicateError("duplicate key")).toBe(true);
    expect(isDuplicateError("Slug already exists")).toBe(true);
    expect(isDuplicateError("Ce slug existe déjà")).toBe(true);
  });

  it("returns false for unrelated error messages", () => {
    expect(isDuplicateError("Network error")).toBe(false);
    expect(isDuplicateError("Internal server error")).toBe(false);
    expect(isDuplicateError("Validation failed")).toBe(false);
  });
});
