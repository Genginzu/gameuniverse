"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import {
  type EntityTranslationDetail,
  type EntityTranslationLangDetail,
  type EntityType,
  EDITABLE_FIELDS,
} from "@/types/admin-translations";

interface TranslationEntityDetailProps {
  detail: EntityTranslationDetail;
  entityType: EntityType;
  isLoading: boolean;
  translatingLangs: Set<string>;
  onBack: () => void;
  onTranslateLang: (lang: string) => void;
  onTranslateAll: () => void;
}

export function TranslationEntityDetail({
  detail,
  entityType,
  isLoading,
  translatingLangs,
  onBack,
  onTranslateLang,
  onTranslateAll,
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
          <button
            onClick={onBack}
            className="rounded-lg p-1.5 text-gray-500 transition-all duration-300 hover:bg-white/20 dark:text-gray-400 dark:hover:bg-slate-700/40"
          >
            <Icon icon="mdi:arrow-left" className="size-5" />
          </button>
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
            className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50"
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

      {/* Language cards */}
      <div className="space-y-3">
        {detail.languages.map((langDetail) => (
          <LangCard
            key={langDetail.language}
            langDetail={langDetail}
            fields={fields}
            isTranslating={translatingLangs.has(langDetail.language)}
            onTranslate={() => onTranslateLang(langDetail.language)}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

function LangCard({
  langDetail,
  fields,
  isTranslating,
  onTranslate,
  t,
}: {
  langDetail: EntityTranslationLangDetail;
  fields: string[];
  isTranslating: boolean;
  onTranslate: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const statusIcon =
    langDetail.status === "complete"
      ? "mdi:check-circle"
      : langDetail.status === "partial"
        ? "mdi:alert-circle"
        : "mdi:close-circle";
  const statusColor =
    langDetail.status === "complete"
      ? "text-emerald-500"
      : langDetail.status === "partial"
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="glass-card rounded-xl p-4 transition-all duration-300">
      {/* Lang header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon={statusIcon} className={`size-5 ${statusColor}`} />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {t(`languages.${langDetail.language}`)}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              langDetail.status === "complete"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : langDetail.status === "partial"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {t(`status.${langDetail.status}`)}
          </span>
        </div>

        {langDetail.status !== "complete" && (
          <button
            onClick={onTranslate}
            disabled={isTranslating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-cyan-500 to-violet-500 px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50"
          >
            {isTranslating ? (
              <Icon icon="mdi:loading" className="size-3.5 animate-spin" />
            ) : (
              <Icon icon="mdi:translate" className="size-3.5" />
            )}
            {t("buttons.translate")}
          </button>
        )}
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {fields.map((field) => {
          const value = langDetail.fields[field];
          const isFilled = value !== null && value.trim() !== "";
          return (
            <div key={field} className="rounded-lg bg-white/10 p-2.5 dark:bg-slate-800/30">
              <span className="mb-1 block text-[10px] font-medium text-gray-500 uppercase dark:text-gray-400">
                {field}
              </span>
              {isFilled ? (
                <p className="line-clamp-2 text-xs text-gray-900 dark:text-white">{value}</p>
              ) : (
                <p className="text-xs text-gray-400 italic dark:text-gray-500">
                  {t("detail.empty")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
