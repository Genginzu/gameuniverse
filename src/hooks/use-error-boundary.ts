"use client";

import { useCallback } from "react";
import { useError } from "@/components/providers/ErrorProvider";
import { ErrorType, classifyError } from "@/lib/error-handling";

// Hook pour déclencher manuellement l'Error Boundary
export function useErrorBoundary() {
  const { handleError } = useError();

  const showBoundary = useCallback(
    (error: unknown) => {
      const appError = classifyError(error);

      // Pour certains types d'erreurs, on préfère les gérer avec des toasts
      if (appError.type === ErrorType.VALIDATION || appError.type === ErrorType.AUTHENTICATION) {
        handleError(appError);
        return;
      }

      // Pour les erreurs critiques, on déclenche l'Error Boundary
      throw appError;
    },
    [handleError]
  );

  return { showBoundary };
}

// Hook pour capturer les erreurs async et les transformer en erreurs sync
export function useAsyncErrorBoundary() {
  const { showBoundary } = useErrorBoundary();

  const captureAsyncError = useCallback(
    async <T>(asyncOperation: () => Promise<T>, fallbackValue?: T): Promise<T | undefined> => {
      try {
        return await asyncOperation();
      } catch (error) {
        // Si on a une valeur de fallback, on l'utilise et on affiche juste un toast
        if (fallbackValue !== undefined) {
          // Erreur capturée avec fallback — on retourne la valeur par défaut
          return fallbackValue;
        }

        // Sinon, on déclenche l'Error Boundary
        showBoundary(error);
        return undefined;
      }
    },
    [showBoundary]
  );

  return { captureAsyncError };
}

// Hook pour gérer les erreurs de formulaire
export function useFormErrorHandler() {
  const { handleError } = useError();

  const handleFormError = useCallback(
    (error: unknown, fieldName?: string) => {
      const appError = classifyError(error);

      // Personnaliser le message selon le type d'erreur
      let message = appError.message;
      if (fieldName && appError.type === ErrorType.VALIDATION) {
        message = `Erreur dans le champ "${fieldName}": ${message}`;
      }

      handleError(
        {
          ...appError,
          message,
        },
        `form-${fieldName || "unknown"}`
      );
    },
    [handleError]
  );

  return { handleFormError };
}

// Hook pour gérer les erreurs de navigation
export function useNavigationErrorHandler() {
  const { handleError } = useError();

  const handleNavigationError = useCallback(
    (error: unknown, route?: string) => {
      const appError = classifyError(error);

      let message = appError.message;
      if (route) {
        message = `Erreur lors de la navigation vers "${route}": ${message}`;
      }

      handleError(
        {
          ...appError,
          message,
        },
        `navigation-${route || "unknown"}`
      );
    },
    [handleError]
  );

  return { handleNavigationError };
}
