"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import {
  AuthCard,
  AUTH_PRIMARY_BTN_CLASS,
  AUTH_SECONDARY_BTN_CLASS,
} from "@/components/auth/AuthCard";

function AuthErrorContent() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const error = searchParams.get("message") || t("error.generic");

  return (
    <AuthLayout>
      <AuthCard
        icon="lucide:alert-triangle"
        iconVariant="danger"
        title={t("error.title")}
        description={t("error.description")}
      >
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild className={AUTH_PRIMARY_BTN_CLASS}>
            <Link href="/auth">{t("error.tryAgain")}</Link>
          </Button>
          <Button asChild variant="outline" className={AUTH_SECONDARY_BTN_CLASS}>
            <Link href="/">{t("error.backHome")}</Link>
          </Button>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-editorial-bg" />}>
      <AuthErrorContent />
    </Suspense>
  );
}
