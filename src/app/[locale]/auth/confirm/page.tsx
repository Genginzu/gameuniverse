import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard, AUTH_PRIMARY_BTN_CLASS } from "@/components/auth/AuthCard";
import { EmailLinkConfirmCard } from "@/components/auth/EmailLinkConfirmCard";
import { isAllowedOtpType, isSafeRelativePath } from "@/lib/utils/authLinks";

interface ConfirmSearchParams {
  token?: string;
  type?: string;
  redirect_to?: string;
  error?: string;
}

interface ConfirmPageProps {
  searchParams: Promise<ConfirmSearchParams>;
}

/**
 * /auth/confirm — email link interstitial. Nothing is verified on GET: the
 * user confirms with a same-origin POST to /api/auth/callback.
 */
export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const params = await searchParams;
  const t = await getTranslations("auth.confirm");

  if (params.error) {
    // Never echo the raw query value: anyone could print arbitrary text inside
    // the site's official error card (phishing).
    return (
      <AuthLayout>
        <AuthCard
          icon="lucide:x-circle"
          iconVariant="danger"
          title={t("errorTitle")}
          description={t("errorDescription")}
        >
          <Button asChild className={AUTH_PRIMARY_BTN_CLASS}>
            <Link href="/auth">{t("backToLogin")}</Link>
          </Button>
        </AuthCard>
      </AuthLayout>
    );
  }

  if (!params.token) {
    redirect("/auth");
  }

  return (
    <AuthLayout>
      <EmailLinkConfirmCard
        tokenHash={params.token}
        type={isAllowedOtpType(params.type) ? params.type : "signup"}
        next={isSafeRelativePath(params.redirect_to) ? params.redirect_to : undefined}
      />
    </AuthLayout>
  );
}
