"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  showRetryButton?: boolean;
  showReloadButton?: boolean;
}

export function ErrorFallback({
  error,
  resetError,
  title = "Une erreur s'est produite",
  description,
  showHomeButton = true,
  showRetryButton = true,
  showReloadButton = true,
}: ErrorFallbackProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  const handleReload = () => {
    window.location.reload();
  };

  const errorMessage = description || error?.message || "Une erreur inattendue s'est produite.";

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            {showRetryButton && resetError && (
              <Button onClick={resetError} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            )}

            {showHomeButton && (
              <Button variant="outline" onClick={handleGoHome} className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Button>
            )}

            {showReloadButton && (
              <Button variant="outline" onClick={handleReload} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Recharger la page
              </Button>
            )}
          </div>

          {process.env.NODE_ENV === "development" && error && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Détails techniques (développement)
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Composant spécialisé pour les erreurs de chargement de page
export function PageErrorFallback({
  error,
  resetError,
}: {
  error?: Error;
  resetError?: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      resetError={resetError}
      title="Erreur de chargement de la page"
      description="La page n'a pas pu être chargée correctement."
      showHomeButton={true}
      showRetryButton={true}
      showReloadButton={true}
    />
  );
}

// Composant spécialisé pour les erreurs de composants
export function ComponentErrorFallback({
  error,
  resetError,
}: {
  error?: Error;
  resetError?: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      resetError={resetError}
      title="Erreur du composant"
      description="Ce composant a rencontré une erreur."
      showHomeButton={false}
      showRetryButton={true}
      showReloadButton={false}
    />
  );
}

// Composant spécialisé pour les erreurs réseau
export function NetworkErrorFallback({
  error,
  resetError,
}: {
  error?: Error;
  resetError?: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      resetError={resetError}
      title="Erreur de connexion"
      description="Impossible de se connecter au serveur. Vérifiez votre connexion internet."
      showHomeButton={false}
      showRetryButton={true}
      showReloadButton={false}
    />
  );
}
