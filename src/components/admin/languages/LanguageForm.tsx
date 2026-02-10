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
import { FaSave } from "react-icons/fa";
import type { LanguageFormData } from "@/lib/validations/admin-language-form";

export interface LanguageFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<LanguageFormData>;
  onSubmit: (data: LanguageFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function LanguageForm({ mode, form, onSubmit, isSubmitting }: LanguageFormProps) {
  const t = useTranslations("admin.languages.form");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-800/60">
          <div className="space-y-5">
            {/* Code field */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("code")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("codePlaceholder")}
                      {...field}
                      disabled={mode === "edit"}
                      className={mode === "edit" ? "bg-gray-50 dark:bg-gray-900/50" : ""}
                      maxLength={10}
                    />
                  </FormControl>
                  <FormDescription>{t("codeDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* English name field */}
            <FormField
              control={form.control}
              name="name"
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

            {/* Native name field */}
            <FormField
              control={form.control}
              name="native_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nativeName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("nativeNamePlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormDescription>{t("nativeNameDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="min-w-[140px] gap-2">
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <FaSave className="h-4 w-4" />
                {mode === "create" ? t("create") : t("save")}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
