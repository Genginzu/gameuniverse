"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CharactersError({ error, reset }: ErrorProps) {
  const t = useTranslations("characters.errors");
  const tCommon = useTranslations("common");

  useEffect(() => {
    Sentry.captureException(error, {
      tags: { section: "characters" },
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <Icon icon="lucide:alert-triangle" className="h-4 w-4" />
          <AlertTitle>{t("loadingTitle")}</AlertTitle>
          <AlertDescription className="mt-2">{t("loadingDescription")}</AlertDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={reset} variant="outline">
              <Icon icon="lucide:refresh-cw" className="mr-2 h-4 w-4" />
              {t("retry")}
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
