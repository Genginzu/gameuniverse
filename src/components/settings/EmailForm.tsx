"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";

// Email validation schema - validates proper email format
export const emailSchema = z.object({
  email: z.string().min(1, "emailRequired").email("emailInvalid"),
});

export type EmailFormValues = z.infer<typeof emailSchema>;

interface EmailFormProps {
  currentEmail: string;
  onUpdate: (email: string) => Promise<void>;
  isLoading: boolean;
}

export function EmailForm({ currentEmail, onUpdate, isLoading }: EmailFormProps) {
  const t = useTranslations("settings.profile");

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: currentEmail || "",
    },
  });

  const onSubmit = async (data: EmailFormValues) => {
    await onUpdate(data.email);
  };

  // Get translated error message
  const getErrorMessage = (errorKey: string | undefined) => {
    if (!errorKey) return undefined;
    // Map error keys to translation keys
    if (errorKey === "emailRequired") return t("emailRequired");
    if (errorKey === "emailInvalid") return t("emailInvalid");
    return errorKey;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                {t("email")}
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  {...field}
                  className={fieldState.error ? "border-red-500" : ""}
                />
              </FormControl>
              {fieldState.error && (
                <FormMessage>{getErrorMessage(fieldState.error.message)}</FormMessage>
              )}
            </FormItem>
          )}
        />
        <LoadingButton
          type="submit"
          loading={isLoading}
          loadingText={t("updateEmail")}
          disabled={!form.formState.isDirty}
        >
          {t("updateEmail")}
        </LoadingButton>
      </form>
    </Form>
  );
}
