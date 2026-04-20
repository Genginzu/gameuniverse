"use client";

import { type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import type { RatingFormData } from "@/lib/validations/admin-rating-form";
import type { SupportedLanguage } from "@/types/admin-languages";
import { RatingFormTranslations } from "./RatingFormTranslations";

export function RatingFormFields({ form, t, supportedLanguages }: { form: UseFormReturn<RatingFormData>; t: (key: string) => string; supportedLanguages: SupportedLanguage[] }) {
  const colorHexValue = form.watch("color_hex");

  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs dark:border-gray-700/40 dark:bg-gray-800/60">
      <div className="space-y-5">
        <FormField control={form.control} name="code" render={({ field }) => (
          <FormItem><FormLabel>{t("code")}</FormLabel><FormControl><Input placeholder={t("codePlaceholder")} {...field} disabled={form.formState.defaultValues?.code !== ""} className={form.formState.defaultValues?.code !== "" ? "bg-gray-50 dark:bg-gray-900/50" : ""} maxLength={10} /></FormControl><FormDescription>{t("codeDescription")}</FormDescription><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="display_name" render={({ field }) => (
          <FormItem><FormLabel>{t("displayName")}</FormLabel><FormControl><Input placeholder={t("displayNamePlaceholder")} {...field} maxLength={50} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="minimum_age" render={({ field }) => (
          <FormItem><FormLabel>{t("minimumAge")}</FormLabel><FormControl><Input type="number" min={0} placeholder="0" {...field} /></FormControl><FormDescription>{t("minimumAgeDescription")}</FormDescription><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="color_hex" render={({ field }) => (
          <FormItem>
            <FormLabel>{t("color")}</FormLabel>
            <div className="flex items-center gap-3">
              <FormControl><Input placeholder={t("colorPlaceholder")} {...field} value={field.value ?? ""} maxLength={7} /></FormControl>
              {colorHexValue && /^#[0-9A-Fa-f]{6}$/.test(colorHexValue) && <span className="inline-block h-8 w-8 shrink-0 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: colorHexValue }} aria-label={t("colorPreview", { color: colorHexValue })} />}
            </div>
            <FormDescription>{t("colorDescription")}</FormDescription><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="icon_url" render={({ field }) => (
          <FormItem><FormLabel>{t("iconUrl")}</FormLabel><FormControl><Input type="url" placeholder={t("iconUrlPlaceholder")} {...field} value={field.value ?? ""} /></FormControl><FormDescription>{t("iconUrlDescription")}</FormDescription><FormMessage /></FormItem>
        )} />
        <RatingFormTranslations form={form} supportedLanguages={supportedLanguages} />
        <FormField control={form.control} name="sort_order" render={({ field }) => (
          <FormItem><FormLabel>{t("sortOrder")}</FormLabel><FormControl><Input type="number" min={0} placeholder="0" {...field} /></FormControl><FormDescription>{t("sortOrderDescription")}</FormDescription><FormMessage /></FormItem>
        )} />
      </div>
    </div>
  );
}
