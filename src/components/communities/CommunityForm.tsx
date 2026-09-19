"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  createCommunitySchema,
  updateCommunitySchema,
  type CreateCommunityInput,
  type UpdateCommunityInput,
} from "@/lib/validations/community";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { LoadingButton } from "@/components/ui/loading-button";

type CommunityFormValues = CreateCommunityInput | UpdateCommunityInput;

interface CommunityFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<CommunityFormValues>;
  onSubmit: (data: CommunityFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

const INPUT_CLASS =
  "border-editorial-line bg-editorial-3 text-white placeholder:text-editorial-muted hover:border-editorial-line focus-visible:border-[rgba(var(--accent-rgb,var(--neon-primary)),0.5)] focus-visible:outline-none! focus-visible:ring-0 focus-visible:ring-offset-0";

export function CommunityForm({
  mode,
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: CommunityFormProps) {
  const t = useTranslations("communities.form");

  const schema = mode === "create" ? createCommunitySchema : updateCommunitySchema;

  const form = useForm<CommunityFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      imageUrl: ((defaultValues as Record<string, unknown>)?.imageUrl as string) ?? "",
    },
  });

  const handleSubmit = async (data: CommunityFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">{t("nameLabel")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("namePlaceholder")}
                  maxLength={100}
                  className={INPUT_CLASS}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">{t("descriptionLabel")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("descriptionPlaceholder")}
                  maxLength={1000}
                  rows={3}
                  className={`${INPUT_CLASS} resize-none`}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">{t("imageLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder={t("imagePlaceholder")}
                  className={INPUT_CLASS}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription className="text-editorial-muted">
                {t("imageDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-editorial-line bg-editorial-3 flex flex-row items-center justify-between gap-4 rounded-xl border p-4 opacity-70">
          <div className="space-y-1">
            <FormLabel className="text-white">{t("visibilityLabel")}</FormLabel>
            <FormDescription className="text-editorial-muted">
              {t("visibilityLockedDescription")}
            </FormDescription>
          </div>
          <Switch checked={false} disabled aria-label={t("visibilityLabel")} />
        </div>

        <LoadingButton
          type="submit"
          loading={isSubmitting}
          loadingText={t("submitting")}
          disabled={!form.formState.isDirty}
          className="border border-[rgba(var(--accent-rgb,var(--neon-primary)),0.5)] bg-[rgba(var(--accent-rgb,var(--neon-primary)),0.15)] text-[rgb(var(--accent-rgb,var(--neon-primary)))] shadow-none hover:border-[rgb(var(--accent-rgb,var(--neon-primary)))] hover:bg-[rgb(var(--accent-rgb,var(--neon-primary)))] hover:text-white"
        >
          {mode === "create" ? t("submit") : t("submitEdit")}
        </LoadingButton>
      </form>
    </Form>
  );
}
