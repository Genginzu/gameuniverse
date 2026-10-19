"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { OPEN_PREFERENCES_EVENT, type ConsentCategories } from "@/components/providers/CookieConsentProvider";

interface ConsentGateProps {
  /** Non-essential category required to render the children. */
  category: keyof ConsentCategories;
  children: ReactNode;
  /** Optional explanatory label shown in the placeholder. */
  placeholderLabel?: string;
}

/**
 * Renders `children` only after the user has consented to the given category.
 * Before consent, shows a placeholder with a button to open cookie preferences.
 * This prevents third-party trackers (e.g. YouTube) from loading pre-consent.
 */
export function ConsentGate({ category, children, placeholderLabel }: ConsentGateProps) {
  const t = useTranslations("legal.cookieBanner");
  const { categories } = useCookieConsent();

  if (categories[category]) return <>{children}</>;

  return (
    <div className="flex min-h-[8rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-editorial-line bg-editorial-3 p-6 text-center">
      <p className="text-sm text-editorial-muted">{placeholderLabel ?? t("mediaDescription")}</p>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT))}
        className="min-h-[44px] rounded-lg btn-filled px-4 py-2 text-sm font-semibold"
      >
        {t("customize")}
      </button>
    </div>
  );
}
