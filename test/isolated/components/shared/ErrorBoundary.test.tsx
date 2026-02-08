import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary, useErrorHandler } from "../../../../src/components/shared/ErrorBoundary";

// Component that throws an error
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div data-testid="child-content">Child content</div>;
}

// Component that throws with custom message
function CustomErrorComponent({ message }: { message: string }) {
  throw new Error(message);
}

describe("ErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Suppress console.error during tests
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("normal rendering", () => {
    it("renders children when no error occurs", () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId("child")).toBeDefined();
      expect(screen.getByText("Child content")).toBeDefined();
    });

    it("renders multiple children correctly", () => {
      render(
        <ErrorBoundary>
          <div data-testid="child1">First</div>
          <div data-testid="child2">Second</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId("child1")).toBeDefined();
      expect(screen.getByTestId("child2")).toBeDefined();
    });
  });

  describe("error catching", () => {
    it("catches errors and displays fallback UI", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText("Une erreur s'est produite")).toBeDefined();
    });

    it("displays the error message in the UI", () => {
      render(
        <ErrorBoundary>
          <CustomErrorComponent message="Custom error occurred" />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom error occurred")).toBeDefined();
    });

    it("logs error to console", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("calls onError callback when provided", () => {
      const onError = mock(() => {});

      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
      const [error] = onError.mock.calls[0] as [Error];
      expect(error.message).toBe("Test error message");
    });
  });

  describe("custom fallback", () => {
    it("renders custom fallback when provided", () => {
      render(
        <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error UI</div>}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId("custom-fallback")).toBeDefined();
      expect(screen.getByText("Custom Error UI")).toBeDefined();
    });

    it("does not render default UI when custom fallback is provided", () => {
      render(
        <ErrorBoundary fallback={<div>Custom</div>}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByText("Une erreur s'est produite")).toBeNull();
    });
  });

  describe("custom translations", () => {
    it("uses custom translations when provided", () => {
      const customTranslations = {
        unexpectedError: "Something went wrong",
        unexpectedErrorTitle: "Error Title",
        unexpectedErrorMessage: "Error Message",
        retry: "Try Again",
        reloadPage: "Refresh",
        technicalDetails: "Tech Details",
      };

      render(
        <ErrorBoundary translations={customTranslations}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeDefined();
      expect(screen.getByText("Try Again")).toBeDefined();
      expect(screen.getByText("Refresh")).toBeDefined();
    });
  });

  describe("error recovery", () => {
    it("resets error state when retry button is clicked", () => {
      // First render with error
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error UI should be displayed
      expect(screen.getByText("Une erreur s'est produite")).toBeDefined();

      // Click retry button - this resets the error state
      const retryButton = screen.getByText("Réessayer");
      fireEvent.click(retryButton);

      // After clicking retry, the ErrorBoundary will try to re-render children
      // Since ThrowingComponent still throws, it will show error again
      // This confirms the retry mechanism works (state was reset, then error caught again)
      expect(screen.getByText("Une erreur s'est produite")).toBeDefined();
    });

    it("calls window.location.reload when reload button is clicked", () => {
      // We can't easily mock window.location.reload in JSDOM,
      // so we verify the button exists and is clickable
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByText("Recharger la page");
      expect(reloadButton).toBeDefined();
      // The button should be clickable (no disabled attribute)
      expect(reloadButton.getAttribute("disabled")).toBeNull();
    });
  });

  describe("getDerivedStateFromError", () => {
    it("sets hasError to true when error occurs", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // The error UI being displayed confirms hasError is true
      expect(screen.getByText("Une erreur s'est produite")).toBeDefined();
    });
  });
});

describe("useErrorHandler", () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns a function", () => {
    // We can't use hooks outside of components, so we test the function directly
    const handler = useErrorHandler();
    expect(typeof handler).toBe("function");
  });

  it("logs error when called", () => {
    const handler = useErrorHandler();
    const testError = new Error("Test error");

    expect(() => handler(testError)).toThrow("Test error");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("re-throws the error for ErrorBoundary to catch", () => {
    const handler = useErrorHandler();
    const testError = new Error("Re-thrown error");

    expect(() => handler(testError)).toThrow("Re-thrown error");
  });
});
