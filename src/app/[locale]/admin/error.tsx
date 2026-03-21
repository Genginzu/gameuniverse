"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("admin.errors");
  const tAdmin = useTranslations("admin");

  useEffect(() => {
    Sentry.captureException(error, {
      tags: { section: "admin" },
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <Icon icon="lucide:alert-triangle" className="h-4 w-4" />
          <AlertTitle>{t("title")}</AlertTitle>
          <AlertDescription className="mt-2">{t("genericMessage")}</AlertDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={reset} variant="outline">
              <Icon icon="lucide:refresh-cw" className="mr-2 h-4 w-4" />
              {t("retry")}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/dashboard`}>
                <Icon icon="lucide:home" className="mr-2 h-4 w-4" />
                {tAdmin("backToDashboard")}
              </Link>
            </Button>
          </div>
        </Alert>
      </div>
    </div>
  );
}
