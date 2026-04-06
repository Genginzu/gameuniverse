"use client";

import { type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
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

import { DescriptorFormTranslations } from "./DescriptorFormTranslations";
import type { DescriptorFormData } from "@/lib/validations/admin-descriptor-form";
import { Icon } from "@iconify/react";

export interface DescriptorFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<DescriptorFormData>;
  onSubmit: (data: DescriptorFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function DescriptorForm({ mode, form, onSubmit, isSubmitting }: DescriptorFormProps) {
  const t = useTranslations("admin.ageClassifications.descriptors.form");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xs dark:border-gray-700/40 dark:bg-gray-800/60">
          <div className="space-y-5">
            {/* Code */}
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
                      maxLength={30}
                    />
                  </FormControl>
                  <FormDescription>{t("codeDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* URL de l'icône */}
            <FormField
              control={form.control}
              name="icon_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("iconUrl")}</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder={t("iconUrlPlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>{t("iconUrlDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section traductions */}
        <DescriptorFormTranslations form={form} />

        {/* Bouton de soumission */}
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
