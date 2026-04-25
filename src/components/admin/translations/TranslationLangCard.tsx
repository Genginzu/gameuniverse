"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { EntityTranslationLangDetail } from "@/types/admin-translations";

interface TranslationLangCardProps {
  langDetail: EntityTranslationLangDetail;
  fields: string[];
  isTranslating: boolean;
  isSaving: boolean;
  onTranslate: () => void;
  onSave: (lang: string, fields: Record<string, string>) => void;
}

export function TranslationLangCard({
  langDetail,
  fields,
  isTranslating,
  isSaving,
  onTranslate,
  onSave,
}: TranslationLangCardProps) {
  const t = useTranslations("admin.translations");

  // Local editable state — initialized from server data
  const [editedFields, setEditedFields] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of fields) initial[f] = langDetail.fields[f] ?? "";
    return initial;
  });

  // Track if user has manually changed anything
  const hasChanges = fields.some((f) => {
    const original = langDetail.fields[f] ?? "";
    return editedFields[f] !== original;
  });

  const handleFieldChange = useCallback((field: string, value: string) => {
    setEditedFields((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = () => {
    const nonEmpty: Record<string, string> = {};
    for (const [k, v] of Object.entries(editedFields)) {
      if (v.trim()) nonEmpty[k] = v;
    }
    onSave(langDetail.language, nonEmpty);
  };

  // Sync local state when server data changes (after translate)
  const serverKey = fields.map((f) => langDetail.fields[f] ?? "").join("|");
  const [lastServerKey, setLastServerKey] = useState(serverKey);
  if (serverKey !== lastServerKey) {
    setLastServerKey(serverKey);
    const synced: Record<string, string> = {};
    for (const f of fields) synced[f] = langDetail.fields[f] ?? "";
    setEditedFields(synced);
  }

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
    <div className="flex h-full flex-col rounded-xl border border-gray-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl transition-all duration-300 dark:border-slate-700/60 dark:bg-slate-800/60">
      {/* Header */}
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

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-all duration-300 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
            >
              {isSaving ? (
                <Icon icon="mdi:loading" className="size-3.5 animate-spin" />
              ) : (
                <Icon icon="mdi:content-save" className="size-3.5" />
              )}
              {t("buttons.save")}
            </button>
          )}
          <button
            onClick={onTranslate}
            disabled={isTranslating}
            className="from-palette-secondary-500 to-palette-primary-500 inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50"
          >
            {isTranslating ? (
              <Icon icon="mdi:loading" className="size-3.5 animate-spin" />
            ) : (
              <Icon icon="mdi:translate" className="size-3.5" />
            )}
            {t("buttons.translate")}
          </button>
        </div>
      </div>

      {/* Editable fields — stacked, description grows to fill */}
      <div className="flex flex-1 flex-col gap-2">
        {fields.map((field) => {
          const isLargeField =
            field === "description" || field === "biography" || field === "storyline";
          return (
            <div
              key={field}
              className={`rounded-lg border border-gray-200/50 bg-gray-50/80 p-3 dark:border-slate-600/50 dark:bg-slate-900/50 ${isLargeField ? "flex flex-1 flex-col" : ""}`}
            >
              <label className="mb-1.5 block text-[10px] font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                {field}
              </label>
              <textarea
                value={editedFields[field]}
                rows={isLargeField ? 12 : 2}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                placeholder={t("detail.empty")}
                className={`focus:border-palette-secondary-500 focus:ring-palette-secondary-500 w-full resize-y rounded-lg border border-gray-300/60 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:outline-none dark:border-slate-600/60 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500 ${isLargeField ? "flex-1" : ""}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
