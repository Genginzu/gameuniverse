"use client";

import { useTranslations } from "next-intl";
import { OPEN_PREFERENCES_EVENT } from "@/components/providers/CookieConsentProvider";

/**
 * Footer link that reopens the cookie preferences panel at any time,
 * satisfying the "withdraw consent as easily as giving it" requirement.
 */
export function ManageCookiesButton({ className }: { className?: string }) {
  const t = useTranslations("footer");

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT))}
      className={className}
    >
      {t("manageCookies")}
    </button>
  );
}
