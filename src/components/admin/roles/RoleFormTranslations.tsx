"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { RoleFormData } from "@/lib/validations/admin-role-form";
import type { SupportedLanguage } from "@/types/admin-languages";

export interface RoleFormTranslationsProps {
  form: UseFormReturn<RoleFormData>;
  supportedLanguages: SupportedLanguage[];
}

export function RoleFormTranslations({ form, supportedLanguages }: RoleFormTranslationsProps) {
  const t = useTranslations("admin.characterRoles.form");

  // Sync translations array with supported languages
  useEffect(() => {
    if (supportedLanguages.length === 0) return;
    const current = form.getValues("translations");
    const updated = supportedLanguages.map((lang) => {
      const existing = current.find((tr) => tr.language_code === lang.code);
      return existing ?? { language_code: lang.code, name: "", description: "" };
    });
    if (current.length !== updated.length) {
      form.setValue("translations", updated);
    }
  }, [supportedLanguages, form]);

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
            <FormField
              control={form.control}
              name={`translations.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("namePlaceholder")} {...field} maxLength={100} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      maxLength={500}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
