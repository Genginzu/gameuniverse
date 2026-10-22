import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  ErrorType,
  createAppError,
  classifyError,
  withRetry,
  reportError,
  type AppError,
} from "@/lib/error-handling";

// Mock the toast module
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

describe("error-handling", () => {
  describe("createAppError", () => {
    it("should create an AppError with required fields", () => {
      const error = createAppError("Test error", ErrorType.VALIDATION);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test error");
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it("should create an AppError with optional fields", () => {
      const cause = new Error("Original error");
      const error = createAppError("Test error", ErrorType.SERVER, {
        code: "ERR_001",
        statusCode: 500,
        details: { field: "value" },
        retryable: true,
        cause,
      });

      expect(error.code).toBe("ERR_001");
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ field: "value" });
      expect(error.retryable).toBe(true);
      expect(error.cause).toBe(cause);
    });

    it("should set retryable based on error type when not specified", () => {
      const networkError = createAppError("Network error", ErrorType.NETWORK);
      const serverError = createAppError("Server error", ErrorType.SERVER);
      const validationError = createAppError("Validation error", ErrorType.VALIDATION);

      expect(networkError.retryable).toBe(true);
      expect(serverError.retryable).toBe(true);
      expect(validationError.retryable).toBe(false);
    });
  });

  describe("classifyError", () => {
    it("should return AppError unchanged if already classified", () => {
      const appError = createAppError("Already classified", ErrorType.VALIDATION);
      const result = classifyError(appError);

      expect(result).toBe(appError);
    });

    it("should classify TypeError with fetch as NETWORK error", () => {
      const fetchError = new TypeError("fetch failed");
      const result = classifyError(fetchError);

      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.retryable).toBe(true);
    });

    it("should classify 401 status as AUTHENTICATION error", () => {
      const error = { status: 401, message: "Unauthorized" };
      const result = classifyError(error);

      expect(result.type).toBe(ErrorType.AUTHENTICATION);
      expect(result.statusCode).toBe(401);
    });

    it("should classify 403 status as AUTHORIZATION error", () => {
      const error = { statusCode: 403, message: "Forbidden" };
      const result = classifyError(error);

      expect(result.type).toBe(ErrorType.AUTHORIZATION);
      expect(result.statusCode).toBe(403);
    });

    it("should classify 404 status as NOT_FOUND error", () => {
      const error = { status: 404, message: "Not found" };
      const result = classifyError(error);

      expect(result.type).toBe(ErrorType.NOT_FOUND);
      expect(result.statusCode).toBe(404);
    });

    it("should classify 4xx status as VALIDATION error", () => {
      const error = { status: 422, message: "Unprocessable entity" };
      const result = classifyError(error);

      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.statusCode).toBe(422);
    });

    it("should classify 5xx status as SERVER error", () => {
      const error = { status: 503, message: "Service unavailable" };
      const result = classifyError(error);

      expect(result.type).toBe(ErrorType.SERVER);
      expect(result.statusCode).toBe(503);
      expect(result.retryable).toBe(true);
    });

    it("should classify unknown errors as UNKNOWN type", () => {
      const error = { someField: "value" };
      const result = classifyError(error);

      expect(result.type).toBe(ErrorType.UNKNOWN);
    });

    it("should use error message if available", () => {
      const error = { message: "Custom error message" };
      const result = classifyError(error);

      expect(result.message).toBe("Custom error message");
    });

    it("should use default message for errors without message", () => {
      const error = {};
      const result = classifyError(error);

      expect(result.message).toBe("Une erreur inattendue s'est produite.");
    });
  });

  describe("withRetry", () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it("should return result on successful operation", async () => {
      const operation = vi.fn(async () => "success");
      const result = await withRetry(operation);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry on retryable errors", async () => {
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw createAppError("Network error", ErrorType.NETWORK, { retryable: true });
        }
        return "success";
      });

      const result = await withRetry(operation, { baseDelay: 10, maxDelay: 50 });

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should not retry on non-retryable errors", async () => {
      const operation = vi.fn(async () => {
        throw createAppError("Validation error", ErrorType.VALIDATION, { retryable: false });
      });

      await expect(withRetry(operation)).rejects.toMatchObject({
        type: ErrorType.VALIDATION,
      });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should throw after max attempts", async () => {
      const operation = vi.fn(async () => {
        throw createAppError("Server error", ErrorType.SERVER, { retryable: true });
      });

      await expect(
        withRetry(operation, { maxAttempts: 2, baseDelay: 10, maxDelay: 50 })
      ).rejects.toMatchObject({
        type: ErrorType.SERVER,
      });
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should use exponential backoff", async () => {
      const delays: number[] = [];
      const originalSetTimeout = globalThis.setTimeout;
      globalThis.setTimeout = ((fn: () => void, delay: number) => {
        delays.push(delay);
        return originalSetTimeout(fn, 1); // Execute immediately for test
      }) as typeof setTimeout;

      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw createAppError("Error", ErrorType.NETWORK, { retryable: true });
        }
        return "success";
      });

      await withRetry(operation, {
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
      });

      globalThis.setTimeout = originalSetTimeout;

      // First retry: 100ms, Second retry: 200ms
      expect(delays[0]).toBe(100);
      expect(delays[1]).toBe(200);
    });
  });

  describe("reportError", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("should log error to console", () => {
      const error = createAppError("Test error", ErrorType.SERVER, {
        code: "ERR_001",
        statusCode: 500,
        details: { field: "value" },
      });

      reportError(error, "TestContext");

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});

describe("useErrorHandler", () => {
  let toastMock: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const toastModule = await import("@/hooks/use-toast");
    toastMock = toastModule.toast as ReturnType<typeof vi.fn>;
    toastMock.mockClear();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should show toast when handleError is called", async () => {
    const { useErrorHandler } = await import("@/lib/error-handling");
    const { handleError } = useErrorHandler();

    const error = new Error("Test error");
    handleError(error, "TestComponent");

    expect(toastMock).toHaveBeenCalledWith({
      variant: "destructive",
      title: "Erreur",
      description: expect.any(String),
    });
  });

  it("should show toast with default context when not provided", async () => {
    const { useErrorHandler } = await import("@/lib/error-handling");
    const { handleError } = useErrorHandler();

    handleError(new Error("Test"));

    expect(toastMock).toHaveBeenCalled();
  });
});
