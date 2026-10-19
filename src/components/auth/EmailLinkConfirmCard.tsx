import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  AuthCard,
  AUTH_PRIMARY_BTN_CLASS,
  AUTH_SECONDARY_BTN_CLASS,
} from "@/components/auth/AuthCard";
import type { EmailLinkOtpType } from "@/lib/utils/authLinks";

interface EmailLinkConfirmCardProps {
  tokenHash: string;
  type: EmailLinkOtpType;
  next?: string;
}

/**
 * Interstitial shown before an email link signs the browser in. The token is
 * only verified when the user explicitly submits this form (same-origin POST
 * to /api/auth/callback), so a forwarded link cannot log someone into the
 * sender's account just by being opened.
 */
export function EmailLinkConfirmCard({ tokenHash, type, next }: EmailLinkConfirmCardProps) {
  const t = useTranslations("auth.confirm");

  return (
    <AuthCard icon="lucide:mail-check" title={t("confirmTitle")} description={t("confirmDescription")}>
      <form method="post" action="/api/auth/callback" className="space-y-3">
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="type" value={type} />
        {next && <input type="hidden" name="next" value={next} />}
        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          <Icon icon="lucide:shield-alert" className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{t("confirmWarning")}</p>
        </div>
        <Button type="submit" className={AUTH_PRIMARY_BTN_CLASS}>
          {t("confirmButton")}
        </Button>
        <Button asChild variant="outline" className={AUTH_SECONDARY_BTN_CLASS}>
          <Link href="/auth">{t("backToLogin")}</Link>
        </Button>
      </form>
    </AuthCard>
  );
}
