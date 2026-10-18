"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ManageCookiesButton } from "@/components/legal/ManageCookiesButton";

/**
 * Inline row of legal links + "Manage cookies" button.
 * Used in minimal footers (auth) that don't already list legal links.
 */
export function LegalFooterLinks({ className = "" }: { className?: string }) {
  const t = useTranslations("footer");
  const linkClass = "text-editorial-muted transition-colors hover:text-editorial-accent";

  return (
    <nav
      aria-label={t("legal")}
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs ${className}`.trim()}
    >
      <Link href="/mentions-legales" className={linkClass}>
        {t("mentionsLegales")}
      </Link>
      <Link href="/confidentialite" className={linkClass}>
        {t("confidentialite")}
      </Link>
      <Link href="/cookies" className={linkClass}>
        {t("cookies")}
      </Link>
      <Link href="/cgv" className={linkClass}>
        {t("cgv")}
      </Link>
      <Link href="/cgu" className={linkClass}>
        {t("cgu")}
      </Link>
      <ManageCookiesButton className={linkClass} />
    </nav>
  );
}
