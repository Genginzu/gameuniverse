import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockHandleError = vi.fn();

vi.mock("@/components/providers/ErrorProvider", () => ({
  useError: () => ({ handleError: mockHandleError }),
}));

vi.mock("@/lib/error-handling", () => ({
  ErrorType: {
    VALIDATION: "VALIDATION",
    AUTHENTICATION: "AUTHENTICATION",
    SERVER: "SERVER",
  },
  classifyError: (e: unknown) => ({
    type: (e as any)?._testType ?? "SERVER",
    message: e instanceof Error ? e.message : "Unknown",
    originalError: e,
  }),
}));

import { useErrorBoundary } from "@/hooks/use-error-boundary";

describe("useErrorBoundary", () => {
  it("showBoundary with validation error calls handleError", () => {
    const { result } = renderHook(() => useErrorBoundary());

    const validationError = Object.assign(new Error("Bad input"), { _testType: "VALIDATION" });

    result.current.showBoundary(validationError);

    expect(mockHandleError).toHaveBeenCalledWith(
      expect.objectContaining({ type: "VALIDATION", message: "Bad input" })
    );
  });

  it("showBoundary with server error throws", () => {
    const { result } = renderHook(() => useErrorBoundary());

    const serverError = new Error("Internal failure");

    expect(() => result.current.showBoundary(serverError)).toThrow();
  });
});
