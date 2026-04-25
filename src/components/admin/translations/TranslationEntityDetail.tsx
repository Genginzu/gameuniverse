"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import {
  type EntityTranslationDetail,
  type EntityType,
  EDITABLE_FIELDS,
} from "@/types/admin-translations";
import { TranslationLangCard } from "./TranslationLangCard";

interface TranslationEntityDetailProps {
  detail: EntityTranslationDetail;
  entityType: EntityType;
  isLoading: boolean;
  translatingLangs: Set<string>;
  savingLangs: Set<string>;
  backHref: string;
  onTranslateLang: (lang: string) => void;
  onTranslateAll: () => void;
  onSaveLang: (lang: string, fields: Record<string, string>) => void;
}

export function TranslationEntityDetail({
  detail,
  entityType,
  isLoading,
  translatingLangs,
  savingLangs,
  backHref,
  onTranslateLang,
  onTranslateAll,
  onSaveLang,
}: TranslationEntityDetailProps) {
  const t = useTranslations("admin.translations");
  const fields = EDITABLE_FIELDS[entityType];
  const hasMissing = detail.languages.some((l) => l.status !== "complete");
  const isTranslatingAny = translatingLangs.size > 0;

  if (isLoading) {
    return (
      <div className="glass-card animate-pulse rounded-2xl p-6">
        <div className="mb-4 h-6 w-48 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="rounded-lg p-1.5 text-gray-500 transition-all duration-300 hover:bg-white/20 dark:text-gray-400 dark:hover:bg-slate-700/40"
          >
            <Icon icon="mdi:arrow-left" className="size-5" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {detail.identifier}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t(`entityTypes.${entityType}`)} — {t("detail.translationStatus")}
            </p>
          </div>
        </div>
        {hasMissing && (
          <button
            onClick={onTranslateAll}
            disabled={isTranslatingAny}
            className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50"
          >
            {isTranslatingAny ? (
              <Icon icon="mdi:loading" className="size-4 animate-spin" />
            ) : (
              <Icon icon="mdi:translate" className="size-4" />
            )}
            {t("detail.translateAll")}
          </button>
        )}
      </div>

      {/* Language cards — 2 columns, fill available height */}
      <div className="grid min-h-[calc(100vh-16rem)] grid-cols-1 gap-4 lg:grid-cols-2">
        {detail.languages.map((langDetail) => (
          <TranslationLangCard
            key={langDetail.language}
            langDetail={langDetail}
            fields={fields}
            isTranslating={translatingLangs.has(langDetail.language)}
            isSaving={savingLangs.has(langDetail.language)}
            onTranslate={() => onTranslateLang(langDetail.language)}
            onSave={onSaveLang}
          />
        ))}
      </div>
    </div>
  );
}
