"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import {
  adminStoreAffiliateSchema,
  type AdminStoreAffiliateData,
  type AdminStoreAffiliateInput,
} from "@/lib/validations/admin-store-affiliate";
import type { AdminStoreAffiliate } from "@/types/affiliate";
import { StoreAffiliateNetworkSelect } from "./StoreAffiliateNetworkSelect";
import { StoreAffiliateFieldError as ValidationMessage } from "./StoreAffiliateFieldError";

interface StoreAffiliateFormProps {
  store: AdminStoreAffiliate;
  onSubmit: (input: AdminStoreAffiliateData) => Promise<void>;
  onCancel: () => void;
}

export function StoreAffiliateForm({ store, onSubmit, onCancel }: StoreAffiliateFormProps) {
  const t = useTranslations("admin.stores");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminStoreAffiliateInput, unknown, AdminStoreAffiliateData>({
    resolver: zodResolver(adminStoreAffiliateSchema),
    defaultValues: {
      affiliateEnabled: store.affiliateEnabled,
      affiliateNetwork: store.affiliateNetwork,
      affiliateTag: store.affiliateTag ?? "",
      affiliateUrlTemplate: store.affiliateUrlTemplate ?? "",
    },
  });

  const handleSubmit = async (data: AdminStoreAffiliateData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast({ title: t("form.success"), variant: "success" });
    } catch {
      toast({ title: t("form.errorGeneric"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/20 bg-white/40 p-4 shadow-lg shadow-black/5 backdrop-blur-xl md:p-6 dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-black/20">
      <h2 className="mb-5 text-lg font-semibold text-gray-900 sm:text-xl dark:text-white">
        {t("form.title", { name: store.name })}
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="affiliateEnabled"
            render={({ field }) => (
              <FormItem className="flex min-h-[44px] items-center justify-between gap-4">
                <div className="space-y-1">
                  <FormLabel>{t("fields.enabled")}</FormLabel>
                  <FormDescription>{t("fields.enabledHelp")}</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <StoreAffiliateNetworkSelect control={form.control} />
            <FormField
              control={form.control}
              name="affiliateTag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.tag")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder={t("fields.tagPlaceholder")}
                      maxLength={200}
                    />
                  </FormControl>
                  <FormDescription>{t("fields.tagHelp")}</FormDescription>
                  <ValidationMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="affiliateUrlTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fields.template")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder={t("fields.templatePlaceholder")}
                    maxLength={1000}
                  />
                </FormControl>
                <FormDescription>{t("fields.templateHelp")}</FormDescription>
                <ValidationMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="min-h-[44px]"
            >
              <Icon icon="lucide:x" className="h-4 w-4" aria-hidden="true" />
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-h-[44px] min-w-[140px]">
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Icon icon="lucide:save" className="h-4 w-4" aria-hidden="true" />
              )}
              {t("form.save")}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}
