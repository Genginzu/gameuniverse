"use client";

import { useTranslations } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Icon } from "@iconify/react";
import type { SupportedLanguage } from "@/types/admin-languages";
import {
  AdminTranslationFields,
  type TranslationFieldConfig,
} from "./AdminTranslationFields";

interface AdminSlugFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<any>;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  supportedLanguages: SupportedLanguage[];
  translationNamespace: string;
  translationFields: TranslationFieldConfig[];
}

export function AdminSlugForm({
  mode,
  form,
  onSubmit,
  isSubmitting,
  supportedLanguages,
  translationNamespace,
  translationFields,
}: AdminSlugFormProps) {
  const t = useTranslations(translationNamespace);

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
                      maxLength={50}
                    />
                  </FormControl>
                  <FormDescription>{t("slugDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <AdminTranslationFields
          form={form}
          supportedLanguages={supportedLanguages}
          translationNamespace={translationNamespace}
          fields={translationFields}
        />

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
