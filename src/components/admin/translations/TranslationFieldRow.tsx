"use client";

import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

export function TranslationFieldRow({
  field,
  sourceValue,
  register,
  error,
}: {
  field: string;
  sourceValue: string;
  register: ReturnType<typeof useForm>["register"];
  error: boolean;
}) {
  const t = useTranslations("admin.translations");
  const isLong = sourceValue.length > 50;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {field} — {t("review.sourceLabel")}
        </label>
        {isLong ? (
          <textarea
            readOnly
            value={sourceValue}
            rows={3}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm opacity-70"
          />
        ) : (
          <input
            readOnly
            value={sourceValue}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm opacity-70"
          />
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {field} — {t("review.targetLabel")}
        </label>
        {isLong ? (
          <textarea
            {...register(field)}
            rows={3}
            className={`glass-input w-full rounded-lg px-3 py-2 text-sm ${error ? "border-red-500 ring-1 ring-red-500" : ""}`}
          />
        ) : (
          <input
            {...register(field)}
            className={`glass-input w-full rounded-lg px-3 py-2 text-sm ${error ? "border-red-500 ring-1 ring-red-500" : ""}`}
          />
        )}
        {error && <p className="mt-1 text-xs text-red-500">{t("review.fieldRequired")}</p>}
      </div>
    </div>
  );
}
