"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useErrorBoundary,
  useAsyncErrorBoundary,
  useFormErrorHandler,
} from "@/hooks/use-error-boundary";
import { useApiClient } from "@/lib/api-client";
import { useAsyncError } from "@/components/providers/ErrorProvider";
import { createAppError, ErrorType } from "@/lib/error-handling";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useTranslations } from "next-intl";

// Ce composant est uniquement pour démonstration et tests
// Il ne devrait pas être utilisé en production
export function ErrorDemo() {
  const [loading, setLoading] = useState(false);
  const { showBoundary } = useErrorBoundary();
  const { captureAsyncError } = useAsyncErrorBoundary();
  const { handleFormError } = useFormErrorHandler();
  const { executeAsync } = useAsyncError();
  const apiClient = useApiClient();
  const t = useTranslations("errors.demo");

  // Démonstration d'erreur qui déclenche l'Error Boundary
  const triggerBoundaryError = () => {
    const error = createAppError(t("simulatedCriticalError"), ErrorType.UNKNOWN);
    showBoundary(error);
  };

  // Démonstration d'erreur réseau avec retry
  const triggerNetworkError = async () => {
    setLoading(true);
    try {
      await apiClient.get("/api/non-existent-endpoint", {
        retryConfig: {
          maxAttempts: 2,
          baseDelay: 500,
        },
      });
    } catch {
      console.warn(t("networkErrorCaptured"));
    } finally {
      setLoading(false);
    }
  };

  // Démonstration d'erreur de validation
  const triggerValidationError = () => {
    const error = createAppError(t("invalidData"), ErrorType.VALIDATION, {
      details: { field: "email", message: t("invalidEmailFormat") },
    });
    handleFormError(error, "email");
  };

  // Démonstration d'erreur d'authentification
  const triggerAuthError = () => {
    const error = createAppError(t("yourSessionExpired"), ErrorType.AUTHENTICATION, {
      statusCode: 401,
    });
    toast({
      variant: "destructive",
      title: t("sessionExpired"),
      description: error.message,
      action: (
        <ToastAction altText={t("reconnect")} onClick={() => console.warn("Redirection vers login")}>
          {t("reconnect")}
        </ToastAction>
      ),
    });
  };

  // Démonstration d'erreur async avec fallback
  const triggerAsyncErrorWithFallback = async () => {
    setLoading(true);
    const result = await captureAsyncError(async () => {
      throw createAppError(t("simulatedAsyncError"), ErrorType.SERVER);
    }, "Valeur de fallback");
    console.warn("Résultat avec fallback:", result);
    setLoading(false);
  };

  // Démonstration d'erreur async avec executeAsync
  const triggerAsyncErrorWithExecuteAsync = async () => {
    setLoading(true);
    const result = await executeAsync(async () => {
      throw createAppError(t("asyncErrorWithExecute"), ErrorType.NETWORK);
    }, "triggerAsyncErrorWithExecuteAsync");
    console.warn("Résultat executeAsync:", result);
    setLoading(false);
  };

  if (process.env.NODE_ENV === "production") {
    return null; // Ne pas afficher en production
  }

  return (
    <Card className="mx-auto mt-8 w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🧪 {t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>{t("description")}</AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-semibold">{t("criticalErrors")}</h3>
            <Button onClick={triggerBoundaryError} variant="destructive" className="w-full">
              {t("triggerBoundary")}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">{t("networkErrors")}</h3>
            <Button
              onClick={triggerNetworkError}
              variant="outline"
              disabled={loading}
              className="w-full"
            >
              {loading ? t("attempting") : t("networkError")}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">{t("validationErrors")}</h3>
            <Button onClick={triggerValidationError} variant="outline" className="w-full">
              {t("validationError")}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">{t("authErrors")}</h3>
            <Button onClick={triggerAuthError} variant="outline" className="w-full">
              {t("sessionExpired")}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">{t("asyncFallback")}</h3>
            <Button
              onClick={triggerAsyncErrorWithFallback}
              variant="outline"
              disabled={loading}
              className="w-full"
            >
              {loading ? t("processing") : "Async + Fallback"}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">{t("asyncExecute")}</h3>
            <Button
              onClick={triggerAsyncErrorWithExecuteAsync}
              variant="outline"
              disabled={loading}
              className="w-full"
            >
              {loading ? t("processing") : "executeAsync"}
            </Button>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-muted p-4">
          <h4 className="mb-2 font-semibold">{t("howToUse")}</h4>
          <ul className="list-inside list-disc space-y-1 text-sm">
            <li>
              <code>useErrorBoundary()</code> - {t("boundaryHook")}
            </li>
            <li>
              <code>useAsyncError()</code> - {t("asyncHook")}
            </li>
            <li>
              <code>apiClient</code> - {t("apiClient")}
            </li>
            <li>
              <code>ErrorProvider</code> - {t("errorProvider")}
            </li>
            <li>
              <code>ErrorBoundary</code> - {t("errorBoundary")}
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
