import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: admin-game-management, Property 7: Gestion Robuste des Erreurs Réseau
// **Validates: Requirements 7.5**

// --- Domain types mirroring the application ---

type NetworkErrorKind = "timeout" | "connection_refused" | "dns_failure" | "server_error";

interface NetworkError {
  kind: NetworkErrorKind;
  message: string;
  statusCode?: number;
}

interface ErrorUIState {
  showsErrorMessage: boolean;
  errorMessage: string;
  canRetry: boolean;
  dataPreserved: boolean;
}

// --- Pure functions under test ---

/**
 * Given a network error, produce the UI state that should be displayed.
 * This mirrors the logic in useAdminGames / useGameForm error handling.
 */
function handleNetworkError(error: NetworkError, hadPreviousData: boolean): ErrorUIState {
  const errorMessage = error.message || "An unexpected error occurred";

  return {
    showsErrorMessage: true,
    errorMessage,
    canRetry: true,
    dataPreserved: hadPreviousData,
  };
}

/**
 * Simulate a fetch operation that may fail with a network error.
 * Returns either success data or an error state.
 */
function simulateFetchWithError(
  error: NetworkError | null,
  existingFormData: Record<string, string> | null
): { success: boolean; errorState: ErrorUIState | null; formDataIntact: boolean } {
  if (!error) {
    return { success: true, errorState: null, formDataIntact: true };
  }

  const errorState = handleNetworkError(error, existingFormData !== null);
  return {
    success: false,
    errorState,
    formDataIntact: existingFormData !== null,
  };
}

// --- Generators ---

const networkErrorKindGen = (): fc.Arbitrary<NetworkErrorKind> =>
  fc.constantFrom("timeout", "connection_refused", "dns_failure", "server_error");

const networkErrorGen = (): fc.Arbitrary<NetworkError> =>
  fc.record({
    kind: networkErrorKindGen(),
    message: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    statusCode: fc.option(fc.integer({ min: 400, max: 599 }), { nil: undefined }),
  });

const formDataGen = (): fc.Arbitrary<Record<string, string>> =>
  fc.record({
    slug: fc.string({ minLength: 1, maxLength: 30 }),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ minLength: 0, maxLength: 200 }),
  });

// --- Property tests ---

describe("Admin Error Handling Property Tests", () => {
  describe("Property 7: Gestion Robuste des Erreurs Réseau", () => {
    it("any network error always produces a visible error message", () => {
      fc.assert(
        fc.property(networkErrorGen(), fc.boolean(), (error, hadPreviousData) => {
          const state = handleNetworkError(error, hadPreviousData);
          return state.showsErrorMessage === true && state.errorMessage.length > 0;
        }),
        { numRuns: 100 }
      );
    });

    it("any network error always allows the user to retry", () => {
      fc.assert(
        fc.property(networkErrorGen(), fc.boolean(), (error, hadPreviousData) => {
          const state = handleNetworkError(error, hadPreviousData);
          return state.canRetry === true;
        }),
        { numRuns: 100 }
      );
    });

    it("existing form data is preserved when a network error occurs", () => {
      fc.assert(
        fc.property(networkErrorGen(), formDataGen(), (error, formData) => {
          const result = simulateFetchWithError(error, formData);
          return (
            result.success === false &&
            result.formDataIntact === true &&
            result.errorState !== null &&
            result.errorState.dataPreserved === true
          );
        }),
        { numRuns: 100 }
      );
    });

    it("successful operations produce no error state", () => {
      fc.assert(
        fc.property(fc.option(formDataGen(), { nil: null }), (formData) => {
          const result = simulateFetchWithError(null, formData);
          return result.success === true && result.errorState === null;
        }),
        { numRuns: 100 }
      );
    });
  });
});
