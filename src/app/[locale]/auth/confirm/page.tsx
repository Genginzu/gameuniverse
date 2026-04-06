import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { EmailOtpType } from "@supabase/supabase-js";

interface ConfirmSearchParams {
  token?: string;
  type?: string;
  redirect_to?: string;
  error?: string;
}

interface ConfirmPageProps {
  searchParams: Promise<ConfirmSearchParams>;
}

function ErrorCard({ title, description, detail, showResend, t }: {
  title: string;
  description: string;
  detail?: string;
  showResend?: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4 dark:from-slate-950 dark:to-slate-900">
      <Card className="mx-auto w-full max-w-md dark:bg-slate-800/95">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Icon icon="lucide:x-circle" className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-red-600 dark:text-red-400">{title}</CardTitle>
          <CardDescription className="dark:text-slate-400">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {detail && <p className="text-muted-foreground text-sm">{detail}</p>}
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth">{t("backToLogin")}</Link>
            </Button>
            {showResend && (
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/resend">{t("resendEmail")}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const t = await getTranslations("auth.confirm");

  if (params.error) {
    return (
      <ErrorCard
        title={t("errorTitle")}
        description={t("errorDescription")}
        detail={params.error}
        t={t}
      />
    );
  }

  if (!params.token) {
    redirect("/auth");
  }

  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.token,
      type: (params.type as EmailOtpType) || "signup",
    });

    if (error) {
      logger.error("Confirmation error", { error: error.message });
      return (
        <ErrorCard
          title={t("failedTitle")}
          description={t("failedDescription")}
          detail={error.message}
          showResend
          t={t}
        />
      );
    }

    const redirectTo = params.redirect_to || "/profile";
    redirect(redirectTo);
  } catch (error) {
    logger.error("Unexpected error in confirm page", { error });
    return (
      <ErrorCard
        title={t("unexpectedTitle")}
        description={t("unexpectedDescription")}
        t={t}
      />
    );
  }
}
