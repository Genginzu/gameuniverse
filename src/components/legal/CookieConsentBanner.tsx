"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import type { ConsentCategories } from "@/components/providers/CookieConsentProvider";

interface CookieConsentBannerProps {
  managerOpen: boolean;
  onCloseManager: () => void;
}

const EQUAL_BTN =
  "min-h-[44px] flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors";

export function CookieConsentBanner({ managerOpen, onCloseManager }: CookieConsentBannerProps) {
  const t = useTranslations("legal.cookieBanner");
  const { decided, categories, acceptAll, rejectAll, save } = useCookieConsent();
  const [draft, setDraft] = useState<ConsentCategories>(categories);

  useEffect(() => setDraft(categories), [categories, managerOpen]);

  // Nothing to show: a choice was made and the manager is closed.
  if (decided && !managerOpen) return null;

  if (managerOpen) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("manageTitle")}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      >
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-editorial-line bg-editorial-2 p-6 text-editorial-muted sm:rounded-2xl">
          <h2 className="font-display text-lg font-semibold text-white">{t("manageTitle")}</h2>

          <div className="mt-4 space-y-3">
            <PreferenceRow
              title={t("necessary")}
              description={t("necessaryDescription")}
              checked
              disabled
              badge={t("necessaryAlwaysOn")}
            />
            <PreferenceRow
              title={t("analytics")}
              description={t("analyticsDescription")}
              checked={draft.analytics}
              onChange={(v) => setDraft((d) => ({ ...d, analytics: v }))}
            />
            <PreferenceRow
              title={t("media")}
              description={t("mediaDescription")}
              checked={draft.media}
              onChange={(v) => setDraft((d) => ({ ...d, media: v }))}
            />
            <PreferenceRow
              title={t("marketing")}
              description={t("marketingDescription")}
              checked={draft.marketing}
              onChange={(v) => setDraft((d) => ({ ...d, marketing: v }))}
            />
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={rejectAll}
              className={`${EQUAL_BTN} border border-editorial-line bg-editorial-3 text-white hover:border-editorial-accent`}
            >
              {t("rejectAll")}
            </button>
            <button
              type="button"
              onClick={() => save(draft)}
              className={`${EQUAL_BTN} border border-editorial-line bg-editorial-3 text-white hover:border-editorial-accent`}
            >
              {t("save")}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className={`${EQUAL_BTN} bg-editorial-accent text-black hover:opacity-90`}
            >
              {t("acceptAll")}
            </button>
          </div>

          {decided && (
            <button
              type="button"
              onClick={onCloseManager}
              className="mt-3 min-h-[44px] w-full text-sm text-editorial-muted underline hover:text-white"
            >
              {t("close")}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-label={t("title")}
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-editorial-line bg-editorial-2/95 p-4 backdrop-blur-sm sm:p-6"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm text-editorial-muted">
          <p className="font-display font-semibold text-white">{t("title")}</p>
          <p className="mt-1 leading-relaxed">
            {t("description")}{" "}
            <Link href="/cookies" className="text-editorial-accent underline">
              {t("policyLink")}
            </Link>
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto">
          <button type="button" onClick={rejectAll} className={`${EQUAL_BTN} border border-editorial-line bg-editorial-3 text-white hover:border-editorial-accent lg:w-40`}>
            {t("rejectAll")}
          </button>
          <button type="button" onClick={acceptAll} className={`${EQUAL_BTN} bg-editorial-accent text-black hover:opacity-90 lg:w-40`}>
            {t("acceptAll")}
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("gu:open-cookie-preferences"))}
            className={`${EQUAL_BTN} border border-editorial-line bg-transparent text-white hover:border-editorial-accent lg:w-40`}
          >
            {t("customize")}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreferenceRow({
  title,
  description,
  checked,
  disabled,
  badge,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  badge?: string;
  onChange?: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-editorial-line bg-editorial-3 p-3">
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-editorial-muted">{description}</p>
      </div>
      {badge ? (
        <span className="shrink-0 text-xs font-medium text-editorial-accent">{badge}</span>
      ) : (
        <label className="relative inline-flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.checked)}
          />
          <span className="h-6 w-11 rounded-full bg-editorial-line transition-colors peer-checked:bg-editorial-accent" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
        </label>
      )}
    </div>
  );
}
