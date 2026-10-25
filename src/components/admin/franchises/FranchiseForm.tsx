"use client";

import { useTranslations } from "next-intl";
import { type FieldValues, type UseFormReturn } from "react-hook-form";
import { Icon } from "@iconify/react";

import {
  AdminTranslationFields,
  type TranslationFieldConfig,
} from "@/components/admin/shared/AdminTranslationFields";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { generateSlugFromTitle } from "@/lib/utils/slug-utils";
import type { FranchiseFormData } from "@/lib/validations/admin-franchise-form";
import type { SupportedLanguage } from "@/types/admin-languages";

const TRANSLATION_FIELDS: TranslationFieldConfig[] = [
  { name: "description", type: "textarea", maxLength: 5000, rows: 6 },
];

interface FranchiseFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<FranchiseFormData>;
  onSubmit: (data: FranchiseFormData) => Promise<void>;
  isSubmitting: boolean;
  supportedLanguages: SupportedLanguage[];
}

export function FranchiseForm({
  mode,
  form,
  onSubmit,
  isSubmitting,
  supportedLanguages,
}: FranchiseFormProps) {
  const t = useTranslations("admin.franchises.form");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-5 rounded-2xl border border-gray-200/60 bg-white/60 p-4 shadow-xs backdrop-blur-xl md:grid-cols-2 md:p-6 dark:border-gray-700/40 dark:bg-gray-800/60">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="text-base"
                    maxLength={255}
                    onChange={(event) => {
                      field.onChange(event);
                      if (mode === "create")
                        form.setValue("slug", generateSlugFromTitle(event.target.value));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("slug")}</FormLabel>
                <FormControl>
                  <Input {...field} className="text-base" maxLength={120} />
                </FormControl>
                <FormDescription>{t("slugDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <AdminTranslationFields
          form={form as unknown as UseFormReturn<FieldValues>}
          supportedLanguages={supportedLanguages}
          translationNamespace="admin.franchises.form"
          fields={TRANSLATION_FIELDS}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 w-full gap-2 sm:w-auto sm:min-w-[140px]"
          >
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
