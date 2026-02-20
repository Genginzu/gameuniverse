import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  ErrorType,
  createAppError,
  classifyError,
  getErrorMessage,
  type AppError,
} from "../../../src/lib/error-handling";

/**
 * Feature: test-reorganization
 * Property: Error Transformation Consistency
 * _For any_ error type, transformation should produce valid error response
 * **Validates: Requirements 6.4**
 */

// Generators for property-based testing
const errorTypeGenerator = fc.constantFrom(...Object.values(ErrorType));

const errorMessageGenerator = fc.string({ minLength: 1, maxLength: 200 });

const statusCodeGenerator = fc.oneof(
  fc.constant(401),
  fc.constant(403),
  fc.constant(404),
  fc.integer({ min: 400, max: 499 }),
  fc.integer({ min: 500, max: 599 })
);

const localeGenerator = fc.constantFrom("fr", "en", "de", "es", "unknown");

const errorCodeGenerator = fc.stringMatching(/^ERR_[A-Z0-9]{3,10}$/);

const errorDetailsGenerator = fc.oneof(
  fc.constant(undefined),
  fc.record({
    field: fc.string({ minLength: 1, maxLength: 20 }),
    value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
  })
);

// Generator for various error-like objects
const rawErrorGenerator = fc.oneof(
  // Standard Error
  fc.record({
    name: fc.constant("Error"),
    message: errorMessageGenerator,
  }),
  // TypeError with fetch (network error)
  fc.record({
    name: fc.constant("TypeError"),
    message: fc.constant("fetch failed"),
  }),
  // HTTP error with status
  fc.record({
    status: statusCodeGenerator,
    message: errorMessageGenerator,
  }),
  // HTTP error with statusCode
  fc.record({
    statusCode: statusCodeGenerator,
    message: errorMessageGenerator,
  }),
  // Unknown error object
  fc.record({
    someField: fc.string(),
  }),
  // Error with message only
  fc.record({
    message: errorMessageGenerator,
  }),
  // Empty object
  fc.constant({})
);

describe("Error Handling Property-Based Tests", () => {
  describe("Property: Error Transformation Consistency", () => {
    describe("createAppError", () => {
      it("for any error type and message, creates a valid AppError", () => {
        fc.assert(
          fc.property(errorMessageGenerator, errorTypeGenerator, (message, type) => {
            const error = createAppError(message, type);

            // Verify it's an Error instance
            expect(error).toBeInstanceOf(Error);

            // Verify required fields
            expect(error.message).toBe(message);
            expect(error.type).toBe(type);
            expect(Object.values(ErrorType)).toContain(error.type);

            // Verify retryable is set based on type
            expect(typeof error.retryable).toBe("boolean");
          }),
          { numRuns: 100 }
        );
      });

      it("for any optional fields, creates AppError with correct properties", () => {
        fc.assert(
          fc.property(
            errorMessageGenerator,
            errorTypeGenerator,
            errorCodeGenerator,
            statusCodeGenerator,
            errorDetailsGenerator,
            fc.boolean(),
            (message, type, code, statusCode, details, retryable) => {
              const error = createAppError(message, type, {
                code,
                statusCode,
                details,
                retryable,
              });

              expect(error.code).toBe(code);
              expect(error.statusCode).toBe(statusCode);
              expect(error.details).toEqual(details);
              expect(error.retryable).toBe(retryable);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("retryable defaults correctly based on error type", () => {
        fc.assert(
          fc.property(errorMessageGenerator, errorTypeGenerator, (message, type) => {
            const error = createAppError(message, type);

            const retryableTypes = [ErrorType.NETWORK, ErrorType.SERVER];
            const expectedRetryable = retryableTypes.includes(type);

            expect(error.retryable).toBe(expectedRetryable);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("classifyError", () => {
      it("for any raw error, produces a valid AppError", () => {
        fc.assert(
          fc.property(rawErrorGenerator, (rawError) => {
            const result = classifyError(rawError);

            // Verify it's an Error instance
            expect(result).toBeInstanceOf(Error);

            // Verify type is a valid ErrorType
            expect(Object.values(ErrorType)).toContain(result.type);

            // Verify message is a non-empty string
            expect(typeof result.message).toBe("string");
            expect(result.message.length).toBeGreaterThan(0);

            // Verify retryable is boolean
            expect(typeof result.retryable).toBe("boolean");
          }),
          { numRuns: 100 }
        );
      });

      it("for any already classified AppError, returns it unchanged", () => {
        fc.assert(
          fc.property(errorMessageGenerator, errorTypeGenerator, (message, type) => {
            const original = createAppError(message, type);
            const result = classifyError(original);

            expect(result).toBe(original);
            expect(result.message).toBe(message);
            expect(result.type).toBe(type);
          }),
          { numRuns: 100 }
        );
      });

      it("for any HTTP status code, classifies to correct error type", () => {
        fc.assert(
          fc.property(statusCodeGenerator, (statusCode) => {
            const error = { status: statusCode, message: "HTTP error" };
            const result = classifyError(error);

            // Verify correct classification
            if (statusCode === 401) {
              expect(result.type).toBe(ErrorType.AUTHENTICATION);
            } else if (statusCode === 403) {
              expect(result.type).toBe(ErrorType.AUTHORIZATION);
            } else if (statusCode === 404) {
              expect(result.type).toBe(ErrorType.NOT_FOUND);
            } else if (statusCode >= 400 && statusCode < 500) {
              expect(result.type).toBe(ErrorType.VALIDATION);
            } else if (statusCode >= 500) {
              expect(result.type).toBe(ErrorType.SERVER);
            }

            // Verify statusCode is preserved
            expect(result.statusCode).toBe(statusCode);
          }),
          { numRuns: 100 }
        );
      });

      it("for any 5xx error, sets retryable to true", () => {
        fc.assert(
          fc.property(fc.integer({ min: 500, max: 599 }), (statusCode) => {
            const error = { status: statusCode, message: "Server error" };
            const result = classifyError(error);

            expect(result.type).toBe(ErrorType.SERVER);
            expect(result.retryable).toBe(true);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("getErrorMessage", () => {
      it("for any error type and locale, returns a non-empty string", () => {
        fc.assert(
          fc.property(errorTypeGenerator, localeGenerator, (type, locale) => {
            const message = getErrorMessage(type, locale);

            expect(typeof message).toBe("string");
            expect(message.length).toBeGreaterThan(0);
          }),
          { numRuns: 100 }
        );
      });

      it("for any error type, French and English messages are different", () => {
        fc.assert(
          fc.property(errorTypeGenerator, (type) => {
            const frMessage = getErrorMessage(type, "fr");
            const enMessage = getErrorMessage(type, "en");

            // Both should be non-empty
            expect(frMessage.length).toBeGreaterThan(0);
            expect(enMessage.length).toBeGreaterThan(0);

            // Messages should be different (localized)
            expect(frMessage).not.toBe(enMessage);
          }),
          { numRuns: 100 }
        );
      });

      it("for any unknown locale, falls back to French", () => {
        fc.assert(
          fc.property(
            errorTypeGenerator,
            fc.stringMatching(/^[a-z]{2}$/).filter((l) => l !== "fr" && l !== "en"),
            (type, unknownLocale) => {
              const unknownResult = getErrorMessage(type, unknownLocale);
              const frResult = getErrorMessage(type, "fr");

              expect(unknownResult).toBe(frResult);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe("Error transformation round-trip", () => {
      it("classifying and re-classifying produces same result", () => {
        fc.assert(
          fc.property(rawErrorGenerator, (rawError) => {
            const firstClassification = classifyError(rawError);
            const secondClassification = classifyError(firstClassification);

            // Re-classifying should return the same object
            expect(secondClassification).toBe(firstClassification);
          }),
          { numRuns: 100 }
        );
      });

      it("created AppErrors maintain all properties through classification", () => {
        fc.assert(
          fc.property(
            errorMessageGenerator,
            errorTypeGenerator,
            errorCodeGenerator,
            statusCodeGenerator,
            fc.boolean(),
            (message, type, code, statusCode, retryable) => {
              const original = createAppError(message, type, {
                code,
                statusCode,
                retryable,
              });

              const classified = classifyError(original);

              // All properties should be preserved
              expect(classified.message).toBe(message);
              expect(classified.type).toBe(type);
              expect(classified.code).toBe(code);
              expect(classified.statusCode).toBe(statusCode);
              expect(classified.retryable).toBe(retryable);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
