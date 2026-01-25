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

// Username validation schema - validates non-empty, trimmed username
export const usernameSchema = z.object({
  username: z
    .string()
    .min(1, "usernameRequired")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "usernameEmpty"),
});

export type UsernameFormValues = z.infer<typeof usernameSchema>;

interface UsernameFormProps {
  currentUsername: string | null;
  onUpdate: (username: string) => Promise<void>;
  isLoading: boolean;
}

export function UsernameForm({ currentUsername, onUpdate, isLoading }: UsernameFormProps) {
  const t = useTranslations("settings.profile");

  const form = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: currentUsername || "",
    },
  });

  const onSubmit = async (data: UsernameFormValues) => {
    await onUpdate(data.username);
  };

  // Get translated error message
  const getErrorMessage = (errorKey: string | undefined) => {
    if (!errorKey) return undefined;
    // Map error keys to translation keys
    if (errorKey === "usernameRequired") return t("usernameRequired");
    if (errorKey === "usernameEmpty") return t("usernameEmpty");
    return errorKey;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-900">
                {t("username")}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("usernamePlaceholder")}
                  {...field}
                  className={fieldState.error ? "border-red-500" : ""}
                />
              </FormControl>
              {fieldState.error && (
                <FormMessage>
                  {getErrorMessage(fieldState.error.message)}
                </FormMessage>
              )}
            </FormItem>
          )}
        />
        <LoadingButton
          type="submit"
          loading={isLoading}
          loadingText={t("updateUsername")}
          disabled={!form.formState.isDirty}
        >
          {t("updateUsername")}
        </LoadingButton>
      </form>
    </Form>
  );
}
