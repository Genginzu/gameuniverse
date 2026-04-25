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
              <FormLabel>{t("nameLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("namePlaceholder")} maxLength={100} {...field} />
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
              <FormLabel>{t("descriptionLabel")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("descriptionPlaceholder")}
                  maxLength={500}
                  rows={3}
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
              <FormLabel>{t("coverImageLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder={t("coverImagePlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>{t("coverImageDescription")}</FormDescription>
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
                <FormLabel>{t("visibilityLabel")}</FormLabel>
                <FormDescription>{t("visibilityDescription")}</FormDescription>
              </div>
            </FormItem>
          )}
        />

        <LoadingButton
          type="submit"
          loading={isSubmitting}
          loadingText={t("submitting")}
          disabled={!form.formState.isDirty}
        >
          {mode === "create" ? t("submit") : t("submitEdit")}
        </LoadingButton>
      </form>
    </Form>
  );
}
