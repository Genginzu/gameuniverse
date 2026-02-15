"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { FaTimes } from "react-icons/fa";
import type { GameFormTabProps } from "@/types/admin-games";
import type { SupportedLanguage } from "@/types/admin-languages";
import { IgdbFieldIndicator } from "./IgdbFieldIndicator";

interface LanguagesTabProps extends GameFormTabProps {
  supportedLanguages: SupportedLanguage[];
}

export function GameFormLanguagesTab({
  form,
  t,
  supportedLanguages,
  isIgdbField,
}: LanguagesTabProps) {
  const watchedLanguages = form.watch("languages");
  const usedCodes = new Set(watchedLanguages.map((l) => l.language_code));
  const availableLanguages = supportedLanguages.filter((l) => !usedCodes.has(l.code));

  const addLanguage = (code: string) => {
    const lang = supportedLanguages.find((l) => l.code === code);
    if (!lang) return;
    const current = form.getValues("languages");
    form.setValue("languages", [
      ...current,
      {
        language_code: lang.code,
        language_name: lang.name,
        has_audio: false,
        has_subtitles: false,
        has_interface: false,
      },
    ]);
  };

  const removeLanguage = (idx: number) => {
    const current = form.getValues("languages");
    form.setValue(
      "languages",
      current.filter((_, i) => i !== idx),
      { shouldValidate: true }
    );
  };

  const displayName = (l: { language_code: string; language_name: string }) => {
    const ref = supportedLanguages.find((s) => s.code === l.language_code);
    return ref ? `${ref.native_name} (${ref.name})` : l.language_name;
  };

  return (
    <div className="space-y-4">
      {isIgdbField && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <IgdbFieldIndicator fieldName="languages" isIgdbField={isIgdbField("languages")} />
        </div>
      )}
      {watchedLanguages.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("noLanguages") ?? "Aucune langue"}
        </p>
      ) : (
        <div className="space-y-3">
          {/* Header row */}
          <div className="hidden items-center gap-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 sm:flex">
            <div className="flex-1">{t("langName") ?? "Langue"}</div>
            <div className="w-20 text-center">{t("langInterface") ?? "Interface"}</div>
            <div className="w-20 text-center">{t("langSubtitles") ?? "Sous-titres"}</div>
            <div className="w-20 text-center">{t("langAudio") ?? "Audio"}</div>
            <div className="w-8" />
          </div>
          {watchedLanguages.map((lang, idx) => (
            <div
              key={lang.language_code || idx}
              className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                <span className="mr-2 inline-block rounded bg-gray-200/80 px-1.5 py-0.5 font-mono text-xs text-gray-500 dark:bg-gray-700/60 dark:text-gray-400">
                  {lang.language_code}
                </span>
                {displayName(lang)}
              </div>
              <label className="inline-flex w-20 cursor-pointer items-center justify-center gap-1.5 text-xs">
                <Checkbox
                  checked={form.watch(`languages.${idx}.has_interface`)}
                  onCheckedChange={(v) => form.setValue(`languages.${idx}.has_interface`, !!v)}
                />
                <span className="sm:hidden">{t("langInterface") ?? "Interface"}</span>
              </label>
              <label className="inline-flex w-20 cursor-pointer items-center justify-center gap-1.5 text-xs">
                <Checkbox
                  checked={form.watch(`languages.${idx}.has_subtitles`)}
                  onCheckedChange={(v) => form.setValue(`languages.${idx}.has_subtitles`, !!v)}
                />
                <span className="sm:hidden">{t("langSubtitles") ?? "Sous-titres"}</span>
              </label>
              <label className="inline-flex w-20 cursor-pointer items-center justify-center gap-1.5 text-xs">
                <Checkbox
                  checked={form.watch(`languages.${idx}.has_audio`)}
                  onCheckedChange={(v) => form.setValue(`languages.${idx}.has_audio`, !!v)}
                />
                <span className="sm:hidden">{t("langAudio") ?? "Audio"}</span>
              </label>
              <button
                type="button"
                onClick={() => removeLanguage(idx)}
                className="flex-shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                aria-label="Supprimer"
              >
                <FaTimes className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {availableLanguages.length > 0 && (
        <select
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600"
          value=""
          onChange={(e) => {
            if (e.target.value) addLanguage(e.target.value);
          }}
        >
          <option value="">{t("addLanguage") ?? "Ajouter une langue…"}</option>
          {availableLanguages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native_name} ({l.name})
            </option>
          ))}
        </select>
      )}

      {form.formState.errors.languages && (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.languages.message}
        </p>
      )}
    </div>
  );
}
