import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary, useErrorHandler } from "@/components/shared/ErrorBoundary";

function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div data-testid="child-content">Child content</div>;
}

function CustomErrorComponent({ message }: { message: string }) {
  throw new Error(message);
}

describe("ErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
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

    it("calls onError callback when provided", () => {
      const onError = vi.fn();

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

  describe("error recovery", () => {
    it("resets error state when retry button is clicked", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Une erreur s'est produite")).toBeDefined();

      const retryButton = screen.getByText("Réessayer");
      fireEvent.click(retryButton);

      // ThrowingComponent still throws, so error UI reappears
      expect(screen.getByText("Une erreur s'est produite")).toBeDefined();
    });

    it("reload button exists and is clickable", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByText("Recharger la page");
      expect(reloadButton).toBeDefined();
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

      expect(screen.getByText("Une erreur s'est produite")).toBeDefined();
    });
  });
});

describe("useErrorHandler", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns a function", () => {
    const handler = useErrorHandler();
    expect(typeof handler).toBe("function");
  });

  it("re-throws the error", () => {
    const handler = useErrorHandler();
    expect(() => handler(new Error("Test error"))).toThrow("Test error");
  });
});
