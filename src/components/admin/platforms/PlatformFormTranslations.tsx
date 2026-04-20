"use client";

import { type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { PlatformFormData } from "@/lib/validations/admin-platform-form";

export function PlatformFormTranslations({ form, t }: { form: UseFormReturn<PlatformFormData>; t: (key: string) => string }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-3 rounded-xl border border-white/20 bg-white/30 p-4 dark:border-slate-700/40 dark:bg-slate-800/40">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">🇫🇷 FR</h3>
        <FormField control={form.control} name="translations.0.name" render={({ field }) => (
          <FormItem><FormLabel>{t("nameFr")}</FormLabel><FormControl><Input placeholder={t("nameFrPlaceholder")} {...field} maxLength={100} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="translations.0.abbreviation" render={({ field }) => (
          <FormItem><FormLabel>{t("abbreviation")}</FormLabel><FormControl><Input placeholder={t("abbreviationPlaceholder")} {...field} value={field.value ?? ""} maxLength={20} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <div className="space-y-3 rounded-xl border border-white/20 bg-white/30 p-4 dark:border-slate-700/40 dark:bg-slate-800/40">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">🇬🇧 EN</h3>
        <FormField control={form.control} name="translations.1.name" render={({ field }) => (
          <FormItem><FormLabel>{t("nameEn")}</FormLabel><FormControl><Input placeholder={t("nameEnPlaceholder")} {...field} maxLength={100} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="translations.1.abbreviation" render={({ field }) => (
          <FormItem><FormLabel>{t("abbreviation")}</FormLabel><FormControl><Input placeholder={t("abbreviationPlaceholder")} {...field} value={field.value ?? ""} maxLength={20} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
    </div>
  );
}
