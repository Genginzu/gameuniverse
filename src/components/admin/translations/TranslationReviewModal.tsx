"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Icon } from "@iconify/react";
import {
  EDITABLE_FIELDS,
  type TranslationMissingItem,
  type EntityType,
} from "@/types/admin-translations";
import { TranslationFieldRow } from "./TranslationFieldRow";

interface TranslationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: TranslationMissingItem;
  translatedFields: Record<string, string>;
  entityType: EntityType;
  targetLang: string;
  onSave: (fields: Record<string, string>) => Promise<void>;
  isSaving: boolean;
}

function buildSchema(entityType: EntityType) {
  const fields = EDITABLE_FIELDS[entityType];
  const shape: Record<string, z.ZodString> = {};
  for (const field of fields) shape[field] = z.string().min(1);
  return z.object(shape);
}

export function TranslationReviewModal({ isOpen, onClose, item, translatedFields, entityType, targetLang, onSave, isSaving }: TranslationReviewModalProps) {
  const t = useTranslations("admin.translations");
  const fields = EDITABLE_FIELDS[entityType];
  const schema = useMemo(() => buildSchema(entityType), [entityType]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    defaultValues: translatedFields,
  });

  useEffect(() => {
    reset(translatedFields);
  }, [translatedFields, reset]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card mx-4 w-full max-w-3xl rounded-2xl border border-white/20 p-6 shadow-xl dark:border-slate-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("review.title")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 transition-all duration-300 hover:bg-white/20 dark:text-gray-400 dark:hover:bg-slate-700/40"><Icon icon="mdi:close" className="size-5" /></button>
        </div>
        <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          {item.identifier} — {t(`entityTypes.${entityType}`)} — {t(`languages.${targetLang}`)}
        </div>
        <form
          onSubmit={handleSubmit(async (data) => {
            await onSave(data);
          })}
          className="space-y-4"
        >
          {fields.map((field) => (
            <TranslationFieldRow
              key={field}
              field={field}
              sourceValue={item.sourceText[field] ?? ""}
              register={register}
              error={!!errors[field]}
            />
          ))}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-300 hover:bg-white/20 disabled:opacity-50 dark:border-slate-700/50 dark:text-gray-300 dark:hover:bg-slate-700/40"
            >
              {t("buttons.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="from-palette-secondary-500 to-palette-primary-500 inline-flex items-center gap-2 rounded-lg bg-linear-to-r px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50"
            >
              {isSaving && <Icon icon="mdi:loading" className="size-4 animate-spin" />}
              {t("buttons.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
