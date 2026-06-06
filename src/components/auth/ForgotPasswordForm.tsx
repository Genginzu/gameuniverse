"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations, useLocale } from "next-intl";
import {
  AuthCard,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_LINK_CLASS,
  AUTH_PRIMARY_BTN_CLASS,
  AUTH_SECONDARY_BTN_CLASS,
} from "@/components/auth/AuthCard";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const supabase = createClient();
  const t = useTranslations("auth.forgotPassword");
  const locale = useLocale();

  const forgotPasswordSchema = z.object({
    email: z.string().email(t("emailValidation")),
  });

  type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setEmail(data.email);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard
        icon="lucide:check-circle"
        iconVariant="success"
        title={t("successTitle")}
        description={t("successSubtitle")}
      >
        <div className="space-y-1 text-center">
          <p className="text-sm text-editorial-muted">{t("successSentTo")}</p>
          <p className="font-semibold text-white">{email}</p>
        </div>
        <div className="rounded-xl border border-editorial-line bg-editorial-3 p-4">
          <h4 className="mb-2 font-semibold text-white">{t("successStepsTitle")}</h4>
          <ol className="list-inside list-decimal space-y-1 text-sm text-editorial-muted">
            <li>{t("successStep1")}</li>
            <li>{t("successStep2")}</li>
            <li>{t("successStep3")}</li>
          </ol>
        </div>
        <div className="text-center text-xs text-editorial-muted">
          <p>{t("successSpam")}</p>
          <button type="button" className={AUTH_LINK_CLASS} onClick={() => setSuccess(false)}>
            {t("successRetry")}
          </button>
        </div>
        <div className="border-t border-editorial-line pt-4">
          <Button asChild variant="outline" className={AUTH_SECONDARY_BTN_CLASS}>
            <Link href="/auth">
              <Icon icon="lucide:arrow-left" className="mr-2 size-4" />
              {t("backToLogin")}
            </Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon="lucide:mail"
      title={t("title")}
      description={t("description")}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <Alert
            variant="destructive"
            className="rounded-xl border-red-500/30 bg-red-500/10 text-red-300"
          >
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className={AUTH_LABEL_CLASS}>
            {t("emailLabel")}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            {...register("email")}
            className={`${AUTH_INPUT_CLASS} ${errors.email ? "border-red-500" : ""}`}
          />
          {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
        </div>
        <Button type="submit" className={AUTH_PRIMARY_BTN_CLASS} disabled={isLoading}>
          {isLoading ? (
            <>
              <Icon icon="lucide:loader-2" className="mr-2 size-4 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            <>
              <Icon icon="lucide:mail" className="mr-2 size-4" />
              {t("submit")}
            </>
          )}
        </Button>
      </form>
      <div className="border-t border-editorial-line pt-4 text-center text-sm text-editorial-muted">
        {t("rememberPassword")}{" "}
        <Link href="/auth" className={AUTH_LINK_CLASS}>
          {t("backToLogin")}
        </Link>
      </div>
    </AuthCard>
  );
}
