"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface AdminErrorFallbackProps {
  error: Error;
  onRetry?: () => void;
}

export function AdminErrorFallback({ error, onRetry }: AdminErrorFallbackProps) {
  const t = useTranslations("admin.errors");

  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("title")}</AlertTitle>
          <AlertDescription className="mt-2">
            {error.message || t("genericMessage")}
          </AlertDescription>
          {onRetry && (
            <div className="mt-4">
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("retry")}
              </Button>
            </div>
          )}
        </Alert>
      </div>
    </div>
  );
}
