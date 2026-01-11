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

// Ce composant est uniquement pour démonstration et tests
// Il ne devrait pas être utilisé en production
export function ErrorDemo() {
  const [loading, setLoading] = useState(false);
  const { showBoundary } = useErrorBoundary();
  const { captureAsyncError } = useAsyncErrorBoundary();
  const { handleFormError } = useFormErrorHandler();
  const { executeAsync } = useAsyncError();
  const apiClient = useApiClient();

  // Démonstration d'erreur qui déclenche l'Error Boundary
  const triggerBoundaryError = () => {
    const error = createAppError(
      "Erreur critique simulée pour tester l'Error Boundary",
      ErrorType.UNKNOWN
    );
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
    } catch (error) {
      console.log("Erreur réseau capturée et gérée par le système");
    } finally {
      setLoading(false);
    }
  };

  // Démonstration d'erreur de validation
  const triggerValidationError = () => {
    const error = createAppError("Les données saisies ne sont pas valides", ErrorType.VALIDATION, {
      details: { field: "email", message: "Format d'email invalide" },
    });
    handleFormError(error, "email");
  };

  // Démonstration d'erreur d'authentification
  const triggerAuthError = () => {
    const error = createAppError("Votre session a expiré", ErrorType.AUTHENTICATION, {
      statusCode: 401,
    });
    toast({
      variant: "destructive",
      title: "Session expirée",
      description: error.message,
      action: (
        <ToastAction altText="Se reconnecter" onClick={() => console.log("Redirection vers login")}>
          Se reconnecter
        </ToastAction>
      ),
    });
  };

  // Démonstration d'erreur async avec fallback
  const triggerAsyncErrorWithFallback = async () => {
    setLoading(true);
    const result = await captureAsyncError(async () => {
      throw createAppError("Erreur async simulée", ErrorType.SERVER);
    }, "Valeur de fallback");
    console.log("Résultat avec fallback:", result);
    setLoading(false);
  };

  // Démonstration d'erreur async avec executeAsync
  const triggerAsyncErrorWithExecuteAsync = async () => {
    setLoading(true);
    const result = await executeAsync(async () => {
      throw createAppError("Erreur async avec executeAsync", ErrorType.NETWORK);
    }, "triggerAsyncErrorWithExecuteAsync");
    console.log("Résultat executeAsync:", result);
    setLoading(false);
  };

  if (process.env.NODE_ENV === "production") {
    return null; // Ne pas afficher en production
  }

  return (
    <Card className="mx-auto mt-8 w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🧪 Démonstration du système de gestion d'erreurs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Ce composant est uniquement visible en développement pour tester les différents types
            d'erreurs.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-semibold">Erreurs critiques (Error Boundary)</h3>
            <Button onClick={triggerBoundaryError} variant="destructive" className="w-full">
              Déclencher Error Boundary
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Erreurs réseau (avec retry)</h3>
            <Button
              onClick={triggerNetworkError}
              variant="outline"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Tentative..." : "Erreur réseau"}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Erreurs de validation</h3>
            <Button onClick={triggerValidationError} variant="outline" className="w-full">
              Erreur de validation
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Erreurs d'authentification</h3>
            <Button onClick={triggerAuthError} variant="outline" className="w-full">
              Session expirée
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Async avec fallback</h3>
            <Button
              onClick={triggerAsyncErrorWithFallback}
              variant="outline"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Traitement..." : "Async + Fallback"}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Async avec executeAsync</h3>
            <Button
              onClick={triggerAsyncErrorWithExecuteAsync}
              variant="outline"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Traitement..." : "executeAsync"}
            </Button>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-muted p-4">
          <h4 className="mb-2 font-semibold">Comment utiliser le système :</h4>
          <ul className="list-inside list-disc space-y-1 text-sm">
            <li>
              <code>useErrorBoundary()</code> - Pour déclencher l'Error Boundary
            </li>
            <li>
              <code>useAsyncError()</code> - Pour gérer les erreurs async avec toasts
            </li>
            <li>
              <code>apiClient</code> - Client API avec retry automatique
            </li>
            <li>
              <code>ErrorProvider</code> - Provider global avec Toaster intégré
            </li>
            <li>
              <code>ErrorBoundary</code> - Composant pour capturer les erreurs React
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
