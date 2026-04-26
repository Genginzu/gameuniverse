"use client";

import { type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { AchievementFormData } from "@/lib/validations/admin-achievement-form";

interface TranslationsSectionProps {
  form: UseFormReturn<AchievementFormData>;
  t: (key: string) => string;
}

export function AchievementTranslationsSection({ form, t }: TranslationsSectionProps) {
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white/40 p-6 shadow-xs dark:border-gray-700/40 dark:bg-gray-800/60">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="nameFr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("nameFr")}</FormLabel>
              <FormControl>
                <Input placeholder={t("nameFrPlaceholder")} {...field} maxLength={200} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nameEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("nameEn")}</FormLabel>
              <FormControl>
                <Input placeholder={t("nameEnPlaceholder")} {...field} maxLength={200} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descriptionFr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("descriptionFr")}</FormLabel>
              <FormControl>
                <Textarea placeholder={t("descriptionFrPlaceholder")} {...field} maxLength={500} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descriptionEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("descriptionEn")}</FormLabel>
              <FormControl>
                <Textarea placeholder={t("descriptionEnPlaceholder")} {...field} maxLength={500} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export function AchievementNumericSection({ form, t }: TranslationsSectionProps) {
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white/40 p-6 shadow-xs dark:border-gray-700/40 dark:bg-gray-800/60">
      <div className="grid gap-5 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="threshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("threshold")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("thresholdPlaceholder")}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="xpValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("xpValue")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("xpValuePlaceholder")}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sortOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("sortOrder")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("sortOrderPlaceholder")}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
