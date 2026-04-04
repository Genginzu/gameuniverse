"use client";

import { useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { SUPPORTED_LANGUAGES, type GameFormTabProps } from "@/types/admin-games";
import { IgdbFieldIndicator } from "./IgdbFieldIndicator";

export function GameFormTranslationsTab({ form, t, isIgdbField, gameId }: GameFormTabProps) {
  const [translatingLang, setTranslatingLang] = useState<string | null>(null);

  const handleTranslate = useCallback(
    async (targetLangCode: string) => {
      if (!gameId) return;
      setTranslatingLang(targetLangCode);
      try {
        const res = await fetch("/api/admin/translations/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "games",
            entityId: gameId,
            targetLang: targetLangCode,
            saveToDb: false,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Translation failed (${res.status})`);
        }

        const { translatedFields } = await res.json();
        const translations = form.getValues("translations");
        const index = translations.findIndex((tr) => tr.language_code === targetLangCode);
        if (index !== -1 && translatedFields) {
          if (translatedFields.title) {
            form.setValue(`translations.${index}.title`, translatedFields.title, {
              shouldDirty: true,
            });
          }
          if (translatedFields.description) {
            form.setValue(`translations.${index}.description`, translatedFields.description, {
              shouldDirty: true,
            });
          }
          if (translatedFields.storyline) {
            form.setValue(`translations.${index}.storyline`, translatedFields.storyline, {
              shouldDirty: true,
            });
          }
        }
      } catch {
        // Error is visible via the loading state clearing — toast could be added later
      } finally {
        setTranslatingLang(null);
      }
    },
    [gameId, form]
  );

  return (
    <div className="space-y-4">
      {isIgdbField && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <IgdbFieldIndicator fieldName="translations" isIgdbField={isIgdbField("translations")} />
        </div>
      )}
      {SUPPORTED_LANGUAGES.map((lang) => {
        const index = form.watch("translations").findIndex((tr) => tr.language_code === lang.code);
        if (index === -1) return null;
        const isTranslating = translatingLang === lang.code;
        return (
          <div
            key={lang.code}
            className="rounded-xl border border-gray-100 bg-gray-50/60 p-5 dark:border-gray-700/30 dark:bg-gray-900/20"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span className="text-xl">{lang.flag}</span>
                {lang.label}
              </span>
              {gameId && (
                <button
                  type="button"
                  disabled={isTranslating || translatingLang !== null}
                  onClick={() => handleTranslate(lang.code)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-cyan-500 to-violet-500 px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                >
                  <Icon
                    icon={isTranslating ? "mdi:loading" : "mdi:translate"}
                    className={`size-3.5 ${isTranslating ? "animate-spin" : ""}`}
                  />
                  {isTranslating ? t("translating") : t("translateWithAI")}
                </button>
              )}
            </div>
            <input type="hidden" {...form.register(`translations.${index}.language_code`)} />
            <div className="space-y-4">
              <FormField
                control={form.control}
                name={`translations.${index}.title`}
                render={({ field: titleField }) => (
                  <FormItem>
                    <FormLabel>{t("title")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("titlePlaceholder")} {...titleField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`translations.${index}.description`}
                render={({ field: descField }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t("descriptionPlaceholder")} rows={4} {...descField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`translations.${index}.storyline`}
                render={({ field: storylineField }) => (
                  <FormItem>
                    <FormLabel>{t("storyline")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("storylinePlaceholder")}
                        rows={4}
                        {...storylineField}
                        value={storylineField.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );
      })}
      {form.formState.errors.translations?.root && (
        <p className="text-destructive text-sm font-medium">
          {form.formState.errors.translations.root.message}
        </p>
      )}
    </div>
  );
}
