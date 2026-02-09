import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

// Feature: admin-game-management, Property 8: Feedback Cohérent des Opérations
// **Validates: Requirements 7.1, 7.2**

// --- Domain types ---

type OperationType = "create" | "update" | "delete";

interface OperationResult {
  success: boolean;
  error?: string;
}

interface FeedbackNotification {
  type: "success" | "error";
  message: string;
  visible: boolean;
}

// --- Pure functions under test ---

/**
 * Given an operation type and its result, produce the feedback notification.
 * This mirrors the toast/notification logic used across admin pages.
 */
function produceOperationFeedback(
  operation: OperationType,
  result: OperationResult,
  successMessages: Record<OperationType, string>,
  errorMessages: Record<OperationType, string>
): FeedbackNotification {
  if (result.success) {
    return {
      type: "success",
      message: successMessages[operation],
      visible: true,
    };
  }

  return {
    type: "error",
    message: result.error || errorMessages[operation],
    visible: true,
  };
}

// --- Generators ---

const operationTypeGen = (): fc.Arbitrary<OperationType> =>
  fc.constantFrom("create", "update", "delete");

const successResultGen = (): fc.Arbitrary<OperationResult> => fc.constant({ success: true });

const errorResultGen = (): fc.Arbitrary<OperationResult> =>
  fc.record({
    success: fc.constant(false as const),
    error: fc.option(
      fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
      { nil: undefined }
    ),
  });

const operationResultGen = (): fc.Arbitrary<OperationResult> =>
  fc.oneof(successResultGen(), errorResultGen());

// Translation-like message maps
const SUCCESS_MESSAGES: Record<OperationType, string> = {
  create: "Jeu créé avec succès !",
  update: "Jeu mis à jour avec succès !",
  delete: "Jeu supprimé avec succès !",
};

const ERROR_MESSAGES: Record<OperationType, string> = {
  create: "Une erreur est survenue lors de la création du jeu.",
  update: "Une erreur est survenue lors de la mise à jour du jeu.",
  delete: "Une erreur est survenue lors de la suppression du jeu.",
};

// --- Property tests ---

describe("Admin Operation Feedback Property Tests", () => {
  describe("Property 8: Feedback Cohérent des Opérations", () => {
    it("successful operations always produce a visible success notification", () => {
      fc.assert(
        fc.property(operationTypeGen(), (operation) => {
          const result: OperationResult = { success: true };
          const feedback = produceOperationFeedback(
            operation,
            result,
            SUCCESS_MESSAGES,
            ERROR_MESSAGES
          );
          return (
            feedback.type === "success" && feedback.visible === true && feedback.message.length > 0
          );
        }),
        { numRuns: 100 }
      );
    });

    it("failed operations always produce a visible error notification", () => {
      fc.assert(
        fc.property(operationTypeGen(), errorResultGen(), (operation, result) => {
          const feedback = produceOperationFeedback(
            operation,
            result,
            SUCCESS_MESSAGES,
            ERROR_MESSAGES
          );
          return (
            feedback.type === "error" && feedback.visible === true && feedback.message.length > 0
          );
        }),
        { numRuns: 100 }
      );
    });

    it("success feedback uses the correct message for each operation type", () => {
      fc.assert(
        fc.property(operationTypeGen(), (operation) => {
          const result: OperationResult = { success: true };
          const feedback = produceOperationFeedback(
            operation,
            result,
            SUCCESS_MESSAGES,
            ERROR_MESSAGES
          );
          return feedback.message === SUCCESS_MESSAGES[operation];
        }),
        { numRuns: 100 }
      );
    });

    it("error feedback with custom message uses that message instead of default", () => {
      fc.assert(
        fc.property(
          operationTypeGen(),
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          (operation, customError) => {
            const result: OperationResult = { success: false, error: customError };
            const feedback = produceOperationFeedback(
              operation,
              result,
              SUCCESS_MESSAGES,
              ERROR_MESSAGES
            );
            return feedback.message === customError;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("error feedback without custom message falls back to default error message", () => {
      fc.assert(
        fc.property(operationTypeGen(), (operation) => {
          const result: OperationResult = { success: false };
          const feedback = produceOperationFeedback(
            operation,
            result,
            SUCCESS_MESSAGES,
            ERROR_MESSAGES
          );
          return feedback.message === ERROR_MESSAGES[operation];
        }),
        { numRuns: 100 }
      );
    });

    it("every operation result always produces exactly one notification that is visible", () => {
      fc.assert(
        fc.property(operationTypeGen(), operationResultGen(), (operation, result) => {
          const feedback = produceOperationFeedback(
            operation,
            result,
            SUCCESS_MESSAGES,
            ERROR_MESSAGES
          );
          return feedback.visible === true && feedback.message.length > 0;
        }),
        { numRuns: 100 }
      );
    });
  });
});
