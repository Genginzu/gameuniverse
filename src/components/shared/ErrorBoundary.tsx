"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  translations?: {
    unexpectedError: string;
    unexpectedErrorTitle: string;
    unexpectedErrorMessage: string;
    retry: string;
    reloadPage: string;
    technicalDetails: string;
  };
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

const defaultTranslations = {
  unexpectedError: "Une erreur s'est produite",
  unexpectedErrorTitle: "Erreur inattendue",
  unexpectedErrorMessage: "Une erreur inattendue s'est produite. Veuillez réessayer.",
  retry: "Réessayer",
  reloadPage: "Recharger la page",
  technicalDetails: "Détails techniques (développement)",
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    // Remonter à Sentry avec le component stack
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    // Appeler le callback d'erreur personnalisé si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    const t = this.props.translations || defaultTranslations;

    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Interface d'erreur par défaut
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Icon icon="lucide:alert-triangle" className="h-5 w-5" />
                {t.unexpectedError}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <Icon icon="lucide:alert-triangle" className="h-4 w-4" />
                <AlertTitle>{t.unexpectedErrorTitle}</AlertTitle>
                <AlertDescription>
                  {this.state.error?.message || t.unexpectedErrorMessage}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <Icon icon="lucide:refresh-cw" className="mr-2 h-4 w-4" />
                  {t.retry}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  {t.reloadPage}
                </Button>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4">
                  <summary className="text-muted-foreground cursor-pointer text-sm">
                    {t.technicalDetails}
                  </summary>
                  <pre className="bg-muted mt-2 overflow-auto rounded p-2 text-xs">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="bg-muted mt-2 overflow-auto rounded p-2 text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook pour utiliser l'Error Boundary de manière déclarative
export function useErrorBoundaryHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo?.componentStack },
    });
    throw error; // Re-throw pour que l'Error Boundary puisse l'attraper
  };
}
