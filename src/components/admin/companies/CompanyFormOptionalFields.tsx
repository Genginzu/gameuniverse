"use client";

import { type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { CompanyFormData } from "@/lib/validations/admin-company-form";

export function CompanyFormOptionalFields({ form, t }: { form: UseFormReturn<CompanyFormData>; t: (key: string) => string }) {
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs dark:border-gray-700/40 dark:bg-gray-800/60">
      <div className="space-y-5">
        <FormField control={form.control} name="website_url" render={({ field }) => (
          <FormItem><FormLabel>{t("websiteUrl")}</FormLabel><FormControl><Input type="url" placeholder={t("websiteUrlPlaceholder")} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="logo_url" render={({ field }) => (
          <FormItem><FormLabel>{t("logoUrl")}</FormLabel><FormControl><Input placeholder={t("logoUrlPlaceholder")} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField control={form.control} name="founded_year" render={({ field }) => (
            <FormItem><FormLabel>{t("foundedYear")}</FormLabel><FormControl><Input type="number" placeholder={t("foundedYearPlaceholder")} {...field} min={1800} max={new Date().getFullYear()} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="headquarters" render={({ field }) => (
            <FormItem><FormLabel>{t("headquarters")}</FormLabel><FormControl><Input placeholder={t("headquartersPlaceholder")} {...field} maxLength={255} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
      </div>
    </div>
  );
}
