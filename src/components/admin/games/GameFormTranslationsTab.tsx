"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { GameFormTabProps } from "@/types/admin-games";
import { SUPPORTED_LANGUAGES } from "@/types/admin-games";

export function GameFormTranslationsTab({ form, t }: GameFormTabProps) {
  return (
    <div className="space-y-4">
      {SUPPORTED_LANGUAGES.map((lang) => {
        const index = form.watch("translations").findIndex((tr) => tr.language_code === lang.code);
        if (index === -1) return null;
        return (
          <div
            key={lang.code}
            className="rounded-xl border border-gray-100 bg-gray-50/60 p-5 dark:border-gray-700/30 dark:bg-gray-900/20"
          >
            <div className="mb-4">
              <span className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span className="text-xl">{lang.flag}</span>
                {lang.label}
              </span>
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
            </div>
          </div>
        );
      })}
      {form.formState.errors.translations?.root && (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.translations.root.message}
        </p>
      )}
    </div>
  );
}
