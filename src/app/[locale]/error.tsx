"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleError({ error, reset }: ErrorProps) {
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <Icon icon="lucide:alert-triangle" className="h-4 w-4" />
          <AlertTitle>{tErrors("unexpectedError")}</AlertTitle>
          <AlertDescription className="mt-2">{tErrors("unexpectedErrorMessage")}</AlertDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={reset} variant="outline">
              <Icon icon="lucide:refresh-cw" className="mr-2 h-4 w-4" />
              {tErrors("retry")}
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <Icon icon="lucide:home" className="mr-2 h-4 w-4" />
                {tCommon("backToHome")}
              </Link>
            </Button>
          </div>
        </Alert>
      </div>
    </div>
  );
}
