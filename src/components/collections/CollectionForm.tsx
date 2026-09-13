"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  createCollectionSchema,
  updateCollectionSchema,
  type CreateCollectionInput,
  type UpdateCollectionInput,
} from "@/lib/validations/collection";
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
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingButton } from "@/components/ui/loading-button";

type CollectionFormValues = CreateCollectionInput | UpdateCollectionInput;

interface CollectionFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<CollectionFormValues>;
  onSubmit: (data: CollectionFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function CollectionForm({
  mode,
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: CollectionFormProps) {
  const t = useTranslations("collections.form");

  const inputClass =
    "border-editorial-line bg-editorial-3 text-white placeholder:text-editorial-muted hover:border-editorial-line focus-visible:border-[rgba(var(--accent-rgb,var(--neon-primary)),0.5)] focus-visible:outline-none! focus-visible:ring-0 focus-visible:ring-offset-0";

  const schema = mode === "create" ? createCollectionSchema : updateCollectionSchema;

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      isPublic: defaultValues?.isPublic ?? false,
      coverImageUrl: ((defaultValues as Record<string, unknown>)?.coverImageUrl as string) ?? "",
    },
  });

  const handleSubmit = async (data: CollectionFormValues) => {
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
                  className={inputClass}
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
                  maxLength={500}
                  rows={3}
                  className={`${inputClass} resize-none`}
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
          name="coverImageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">{t("coverImageLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder={t("coverImagePlaceholder")}
                  className={inputClass}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription className="text-editorial-muted">
                {t("coverImageDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-3">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-white">{t("visibilityLabel")}</FormLabel>
                <FormDescription className="text-editorial-muted">
                  {t("visibilityDescription")}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

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
