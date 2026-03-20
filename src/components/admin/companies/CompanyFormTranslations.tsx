"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { CompanyFormData } from "@/lib/validations/admin-company-form";
import type { SupportedLanguage } from "@/types/admin-languages";

export interface CompanyFormTranslationsProps {
  form: UseFormReturn<CompanyFormData>;
  supportedLanguages: SupportedLanguage[];
}

export function CompanyFormTranslations({
  form,
  supportedLanguages,
}: CompanyFormTranslationsProps) {
  const t = useTranslations("admin.companies.form");

  // Sync translations array with supported languages
  useEffect(() => {
    if (supportedLanguages.length === 0) return;

    const current = form.getValues("translations") ?? [];
    const updated = supportedLanguages.map((lang) => {
      const existing = current.find((tr) => tr.language_code === lang.code);
      return existing ?? { language_code: lang.code, description: "" };
    });

    if (current.length !== updated.length) {
      form.setValue("translations", updated);
    }
  }, [supportedLanguages, form]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {supportedLanguages.map((lang, index) => (
        <div
          key={lang.code}
          className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs dark:border-gray-700/40 dark:bg-gray-800/60"
        >
          <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("descriptionFor", { language: lang.native_name ?? lang.name })}
          </h3>

          <FormField
            control={form.control}
            name={`translations.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("description")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("descriptionPlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                    rows={4}
                    maxLength={2000}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
    </div>
  );
}
