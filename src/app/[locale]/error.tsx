"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleError({ error, reset }: ErrorProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";

  useEffect(() => {
    Sentry.captureException(error, {
      tags: { section: "root" },
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <Icon icon="lucide:alert-triangle" className="h-4 w-4" />
          <AlertTitle>
            {locale === "fr" ? "Une erreur est survenue" : "An error occurred"}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {locale === "fr"
              ? "Une erreur inattendue s'est produite. Veuillez réessayer."
              : "An unexpected error occurred. Please try again."}
          </AlertDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={reset} variant="outline">
              <Icon icon="lucide:refresh-cw" className="mr-2 h-4 w-4" />
              {locale === "fr" ? "Réessayer" : "Retry"}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/dashboard`}>
                <Icon icon="lucide:home" className="mr-2 h-4 w-4" />
                {locale === "fr" ? "Accueil" : "Home"}
              </Link>
            </Button>
          </div>
        </Alert>
      </div>
    </div>
  );
}
