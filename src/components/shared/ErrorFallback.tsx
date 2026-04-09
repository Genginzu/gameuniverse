"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";

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
}: ErrorFallbackProps) {
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <Icon icon="lucide:alert-triangle" className="h-4 w-4" />
        <AlertTitle>{title || tErrors("loadingError")}</AlertTitle>
        <AlertDescription className="mt-2">
          {description || tErrors("unexpectedErrorMessage")}
        </AlertDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          {showRefresh && (
            <Button onClick={() => window.location.reload()} variant="outline">
              <Icon icon="lucide:refresh-cw" className="mr-2 h-4 w-4" />
              {tCommon("reloadPage")}
            </Button>
          )}
          {showBackButton && backUrl && (
            <Button asChild variant="outline">
              <Link href={backUrl}>
                <Icon icon="lucide:arrow-left" className="mr-2 h-4 w-4" />
                {backLabel || tCommon("back")}
              </Link>
            </Button>
          )}
          {showHomeButton && (
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <Icon icon="lucide:home" className="mr-2 h-4 w-4" />
                {tCommon("backToHome")}
              </Link>
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
}
