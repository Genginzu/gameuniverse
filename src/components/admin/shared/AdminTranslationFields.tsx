"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { SupportedLanguage } from "@/types/admin-languages";

export interface TranslationFieldConfig {
  name: string;
  type: "input" | "textarea";
  maxLength?: number;
  rows?: number;
}

interface AdminTranslationFieldsProps {
  form: UseFormReturn<Record<string, unknown>>;
  supportedLanguages: SupportedLanguage[];
  translationNamespace: string;
  fields: TranslationFieldConfig[];
}

export function AdminTranslationFields({
  form,
  supportedLanguages,
  translationNamespace,
  fields,
}: AdminTranslationFieldsProps) {
  const t = useTranslations(translationNamespace);

  // Sync translations array with supported languages
  useEffect(() => {
    if (supportedLanguages.length === 0) return;

    const current = form.getValues("translations");
    const defaultTranslation = (langCode: string) => {
      const defaults: Record<string, string> = { language_code: langCode };
      for (const f of fields) defaults[f.name] = "";
      return defaults;
    };

    const updated = supportedLanguages.map((lang) => {
      const existing = current.find((tr: { language_code: string }) => tr.language_code === lang.code);
      return existing ?? defaultTranslation(lang.code);
    });

    if (current.length !== updated.length) {
      form.setValue("translations", updated);
    }
  }, [supportedLanguages, form, fields]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {supportedLanguages.map((lang, index) => (
        <div
          key={lang.code}
          className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs dark:border-gray-700/40 dark:bg-gray-800/60"
        >
          <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {lang.native_name ?? lang.name} ({lang.code})
          </h3>
          <div className="space-y-4">
            {fields.map((fieldConfig) => (
              <FormField
                key={fieldConfig.name}
                control={form.control}
                name={`translations.${index}.${fieldConfig.name}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(fieldConfig.name)}</FormLabel>
                    <FormControl>
                      {fieldConfig.type === "textarea" ? (
                        <Textarea
                          placeholder={t(`${fieldConfig.name}Placeholder`)}
                          {...field}
                          value={field.value ?? ""}
                          maxLength={fieldConfig.maxLength}
                          rows={fieldConfig.rows}
                        />
                      ) : (
                        <Input
                          placeholder={t(`${fieldConfig.name}Placeholder`)}
                          {...field}
                          maxLength={fieldConfig.maxLength}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
