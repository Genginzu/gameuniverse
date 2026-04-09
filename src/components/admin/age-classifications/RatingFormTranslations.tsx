"use client";

import { useEffect } from "react";
import { type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { RatingFormData } from "@/lib/validations/admin-rating-form";
import type { SupportedLanguage } from "@/types/admin-languages";

export interface RatingFormTranslationsProps {
  form: UseFormReturn<RatingFormData>;
  supportedLanguages: SupportedLanguage[];
}

export function RatingFormTranslations({ form, supportedLanguages }: RatingFormTranslationsProps) {
  const t = useTranslations("admin.ageClassifications.ratings.form");

  // Sync translations array with supported languages
  useEffect(() => {
    if (supportedLanguages.length === 0) return;

    const current = form.getValues("translations");
    const updated = supportedLanguages.map((lang) => {
      const existing = current.find((tr) => tr.language_code === lang.code);
      return existing ?? { language_code: lang.code, description: "" };
    });

    // Only update if the translations array length differs (avoid infinite loops)
    if (current.length !== updated.length) {
      form.setValue("translations", updated);
    }
  }, [supportedLanguages, form]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {t("translations")}
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {supportedLanguages.map((lang, index) => (
          <div
            key={lang.code}
            className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs dark:border-gray-700/40 dark:bg-gray-800/60"
          >
            <h4 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {lang.native_name ?? lang.name} ({lang.code})
            </h4>

            <FormField
              control={form.control}
              name={`translations.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("translationDescription")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("translationDescription")}
                      {...field}
                      maxLength={500}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
