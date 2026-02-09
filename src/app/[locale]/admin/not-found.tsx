"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function AdminNotFound() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("admin.errors");
  const tAdmin = useTranslations("admin");

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert>
          <FileQuestion className="h-4 w-4" />
          <AlertTitle>{t("notFoundTitle")}</AlertTitle>
          <AlertDescription className="mt-2">{t("notFoundDescription")}</AlertDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/${locale}/admin/games`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("backToGames")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/dashboard`}>
                <Home className="mr-2 h-4 w-4" />
                {tAdmin("backToDashboard")}
              </Link>
            </Button>
          </div>
        </Alert>
      </div>
    </div>
  );
}
