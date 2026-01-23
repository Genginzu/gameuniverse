"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CharacterDetailsError({ error, reset }: ErrorProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Character details page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{locale === "fr" ? "Erreur de chargement" : "Loading Error"}</AlertTitle>
          <AlertDescription className="mt-2">
            {locale === "fr"
              ? "Une erreur s'est produite lors du chargement des détails du personnage. Veuillez réessayer."
              : "An error occurred while loading character details. Please try again."}
          </AlertDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={reset} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {locale === "fr" ? "Réessayer" : "Retry"}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/characters`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {locale === "fr" ? "Retour aux personnages" : "Back to characters"}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/dashboard`}>
                <Home className="mr-2 h-4 w-4" />
                {locale === "fr" ? "Retour à l'accueil" : "Back to home"}
              </Link>
            </Button>
          </div>
        </Alert>
      </div>
    </div>
  );
}
