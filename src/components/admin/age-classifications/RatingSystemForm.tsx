"use client";

import { type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

import type { RatingSystemFormData } from "@/lib/validations/admin-rating-system-form";
import { Icon } from "@iconify/react";

export interface RatingSystemFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<RatingSystemFormData>;
  onSubmit: (data: RatingSystemFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function RatingSystemForm({ mode, form, onSubmit, isSubmitting }: RatingSystemFormProps) {
  const t = useTranslations("admin.ageClassifications.form");
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
                      maxLength={10}
                    />
                  </FormControl>
                  <FormDescription>{t("codeDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nom */}
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

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("descriptionPlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                      maxLength={500}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>{t("descriptionHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Codes pays */}
            <FormField
              control={form.control}
              name="country_codes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("countryCodes")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("countryCodesPlaceholder")}
                      value={(field.value ?? []).join(", ")}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const codes = raw
                          .split(",")
                          .map((c) => c.trim().toUpperCase())
                          .filter((c) => c.length > 0);
                        field.onChange(codes);
                      }}
                    />
                  </FormControl>
                  <FormDescription>{t("countryCodesDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* URL du site web */}
            <FormField
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("website")}</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder={t("websitePlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>{t("websiteDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

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
