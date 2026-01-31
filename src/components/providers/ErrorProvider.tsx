"use client";

import React, { createContext, useContext, ReactNode, useCallback } from "react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { useErrorHandler, AppError } from "@/lib/error-handling";

interface ErrorContextType {
  handleError: (error: unknown, context?: string) => void;
  reportError: (error: AppError, context?: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function ErrorProvider({ children, onError }: ErrorProviderProps) {
  const { handleError } = useErrorHandler();

  const reportError = (error: AppError, context?: string) => {
    // Ici on pourrait intégrer avec un service de monitoring
    console.error("Reporting error:", {
      message: error.message,
      type: error.type,
      context,
      stack: error.stack,
    });
  };

  const contextValue: ErrorContextType = {
    handleError,
    reportError,
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      <ErrorBoundary onError={onError}>
        {children}
        <Toaster />
      </ErrorBoundary>
    </ErrorContext.Provider>
  );
}

// Hook pour utiliser le contexte d'erreur
export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
}

// Hook spécialisé pour les erreurs async (utile pour les composants)
export function useAsyncError() {
  const { handleError } = useError();

  const executeAsync = useCallback(
    async function <T>(operation: () => Promise<T>, context?: string): Promise<T | null> {
      try {
        return await operation();
      } catch (error) {
        handleError(error, context);
        return null;
      }
    },
    [handleError]
  );

  return { executeAsync };
}
