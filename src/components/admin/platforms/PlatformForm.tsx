"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { toast } from "@/hooks/use-toast";
import { FaSave, FaTimes } from "react-icons/fa";
import {
  adminPlatformFormSchema,
  type PlatformFormData,
} from "@/lib/validations/admin-platform-form";
import type { AdminPlatform } from "@/types/admin-platforms";

interface PlatformFormProps {
  platform?: AdminPlatform | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PlatformForm({ platform, onSuccess, onCancel }: PlatformFormProps) {
  const t = useTranslations("admin.platforms.form");
  const isEdit = !!platform;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PlatformFormData>({
    resolver: zodResolver(adminPlatformFormSchema),
    defaultValues: {
      slug: platform?.slug ?? "",
      iconUrl: platform?.iconUrl ?? "",
      translations: [
        {
          language_code: "fr",
          name: platform?.translations.find((tr) => tr.language_code === "fr")?.name ?? "",
          abbreviation:
            platform?.translations.find((tr) => tr.language_code === "fr")?.abbreviation ?? "",
        },
        {
          language_code: "en",
          name: platform?.translations.find((tr) => tr.language_code === "en")?.name ?? "",
          abbreviation:
            platform?.translations.find((tr) => tr.language_code === "en")?.abbreviation ?? "",
        },
      ],
    },
  });

  const handleSubmit = async (data: PlatformFormData) => {
    setIsSubmitting(true);
    try {
      const url = isEdit
        ? `/api/admin/platforms/${encodeURIComponent(platform!.slug)}`
        : "/api/admin/platforms";

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (response.status === 409) {
          form.setError("slug", { message: t("errorDuplicate") });
          return;
        }
        throw new Error(body.error || "Failed to save platform");
      }

      toast({ title: t("success"), variant: "success" });
      onSuccess();
    } catch {
      toast({ title: t("errorGeneric"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/20 bg-white/40 p-6 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-black/20">
      <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
        {isEdit ? t("editTitle") : t("createTitle")}
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5" noValidate>
          {/* Slug */}
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
                    disabled={isEdit}
                    className={isEdit ? "bg-gray-50 dark:bg-gray-900/50" : ""}
                    maxLength={50}
                  />
                </FormControl>
                <FormDescription>{t("slugDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Icon URL */}
          <FormField
            control={form.control}
            name="iconUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("iconUrl")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("iconUrlPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Translations — FR & EN side by side */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* FR */}
            <div className="space-y-3 rounded-xl border border-white/20 bg-white/30 p-4 dark:border-slate-700/40 dark:bg-slate-800/40">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">🇫🇷 FR</h3>
              <FormField
                control={form.control}
                name="translations.0.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("nameFr")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("nameFrPlaceholder")} {...field} maxLength={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="translations.0.abbreviation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("abbreviation")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("abbreviationPlaceholder")}
                        {...field}
                        value={field.value ?? ""}
                        maxLength={20}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* EN */}
            <div className="space-y-3 rounded-xl border border-white/20 bg-white/30 p-4 dark:border-slate-700/40 dark:bg-slate-800/40">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">🇬🇧 EN</h3>
              <FormField
                control={form.control}
                name="translations.1.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("nameEn")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("nameEnPlaceholder")} {...field} maxLength={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="translations.1.abbreviation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("abbreviation")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("abbreviationPlaceholder")}
                        {...field}
                        value={field.value ?? ""}
                        maxLength={20}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <FaTimes className="mr-1 h-4 w-4" />
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px] gap-2">
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <FaSave className="h-4 w-4" />
                  {isEdit ? t("save") : t("create")}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
