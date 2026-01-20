"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

interface ErrorFallbackProps {
  title?: string;
  description?: string;
  showRefresh?: boolean;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  backUrl?: string;
  backLabel?: string;
  locale?: string;
}

export function ErrorFallback({
  title,
  description,
  showRefresh = true,
  showBackButton = false,
  showHomeButton = false,
  backUrl,
  backLabel,
  locale = "fr",
}: ErrorFallbackProps) {
  const defaultTitle = locale === "fr" ? "Erreur de chargement" : "Loading Error";
  const defaultDescription =
    locale === "fr"
      ? "Une erreur inattendue s'est produite. Veuillez réessayer."
      : "An unexpected error occurred. Please try again.";
  const refreshLabel = locale === "fr" ? "Recharger la page" : "Reload page";
  const homeLabel = locale === "fr" ? "Retour à l'accueil" : "Back to home";

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{title || defaultTitle}</AlertTitle>
        <AlertDescription className="mt-2">
          {description || defaultDescription}
        </AlertDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          {showRefresh && (
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {refreshLabel}
            </Button>
          )}
          {showBackButton && backUrl && (
            <Button asChild variant="outline">
              <Link href={backUrl}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel || (locale === "fr" ? "Retour" : "Back")}
              </Link>
            </Button>
          )}
          {showHomeButton && (
            <Button asChild variant="outline">
              <Link href={`/${locale}/dashboard`}>
                <Home className="mr-2 h-4 w-4" />
                {homeLabel}
              </Link>
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
}
