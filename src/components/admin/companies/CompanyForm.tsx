"use client";

import { useTranslations } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { CompanyFormData } from "@/lib/validations/admin-company-form";
import type { SupportedLanguage } from "@/types/admin-languages";
import { CompanyFormTranslations } from "./CompanyFormTranslations";
import { CompanyFormOptionalFields } from "./CompanyFormOptionalFields";
import { Icon } from "@iconify/react";

export interface CompanyFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<CompanyFormData>;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  isSubmitting: boolean;
  supportedLanguages: SupportedLanguage[];
}

const COMPANY_TYPES = ["developer", "publisher", "both"] as const;

export function CompanyForm({ mode, form, onSubmit, isSubmitting, supportedLanguages }: CompanyFormProps) {
  const t = useTranslations("admin.companies.form");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs dark:border-gray-700/40 dark:bg-gray-800/60">
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("slug")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("slugPlaceholder")}
                      {...field}
                      disabled={mode === "edit"}
                      className={mode === "edit" ? "bg-gray-50 dark:bg-gray-900/50" : ""}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormDescription>{t("slugDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("namePlaceholder")} {...field} maxLength={255} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("companyType")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("companyTypePlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMPANY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`companyTypes.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <CompanyFormTranslations form={form} supportedLanguages={supportedLanguages} />
        <CompanyFormOptionalFields form={form} t={t} />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="min-w-[140px] gap-2">
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Icon icon="fa:save" className="h-4 w-4" />
                {mode === "create" ? t("create") : t("save")}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
