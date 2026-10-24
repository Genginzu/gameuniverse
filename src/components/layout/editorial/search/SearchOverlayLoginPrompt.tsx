"use client";

/**
 * SearchOverlayLoginPrompt : invite un visiteur non connecté à se connecter
 * avant d'importer un jeu IGDB depuis l'overlay de recherche (issue #376).
 */

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface SearchOverlayLoginPromptProps {
  onLogin: () => void;
}

export function SearchOverlayLoginPrompt({ onLogin }: SearchOverlayLoginPromptProps) {
  const t = useTranslations("globalSearch.overlay");
  return (
    <div
      role="alert"
      className="mb-3 flex flex-col gap-3 rounded-xl border border-editorial-line bg-editorial-3 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <Icon
          icon="lucide:lock"
          className="mt-0.5 size-5 shrink-0 text-editorial-accent"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-base font-semibold">{t("loginToImportTitle")}</p>
          <p className="text-sm text-editorial-muted">{t("loginToImportDescription")}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onLogin}
        className="btn-filled inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-base font-medium"
      >
        <Icon icon="lucide:log-in" className="size-5" aria-hidden />
        {t("loginToImportCta")}
      </button>
    </div>
  );
}
