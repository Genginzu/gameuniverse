"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

function AuthErrorContent() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const error = searchParams.get("message") || t("error.generic");

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl text-red-600">{t("error.title")}</CardTitle>
          <CardDescription className="text-center">{t("error.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>

          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link href="/auth">{t("error.tryAgain")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">{t("error.backHome")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>…</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
