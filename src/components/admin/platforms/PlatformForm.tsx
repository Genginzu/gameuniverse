"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconPicker } from "@/components/shared/IconPicker";
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
import {
  adminPlatformFormSchema,
  type PlatformFormData,
} from "@/lib/validations/admin-platform-form";
import type { AdminPlatform } from "@/types/admin-platforms";
import { PlatformFormTranslations } from "./PlatformFormTranslations";
import { Icon } from "@iconify/react";

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
        { language_code: "fr", name: platform?.translations.find((tr) => tr.language_code === "fr")?.name ?? "", abbreviation: platform?.translations.find((tr) => tr.language_code === "fr")?.abbreviation ?? "" },
        { language_code: "en", name: platform?.translations.find((tr) => tr.language_code === "en")?.name ?? "", abbreviation: platform?.translations.find((tr) => tr.language_code === "en")?.abbreviation ?? "" },
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
        if (response.status === 409) { form.setError("slug", { message: t("errorDuplicate") }); return; }
        throw new Error(body.error || "Failed to save platform");
      }
      toast({ title: t("success"), variant: "success" });
      onSuccess();
    } catch { toast({ title: t("errorGeneric"), variant: "destructive" }); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="rounded-2xl border border-white/20 bg-white/40 p-6 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-black/20">
      <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
        {isEdit ? t("editTitle") : t("createTitle")}
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5" noValidate>
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
          <FormField
            control={form.control}
            name="iconUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("icon")}</FormLabel>
                <FormControl>
                  <IconPicker
                    value={field.value || null}
                    onChange={(iconName) => field.onChange(iconName ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <PlatformFormTranslations form={form} t={t} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <Icon icon="fa:times" className="mr-1 h-4 w-4" />
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px] gap-2">
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Icon icon="fa:save" className="h-4 w-4" />
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
