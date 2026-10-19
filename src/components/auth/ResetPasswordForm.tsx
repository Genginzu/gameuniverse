"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { usePasswordRecoveryLink } from "@/hooks/usePasswordRecoveryLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@iconify/react";
import { Link, useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import {
  AuthCard,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_LINK_CLASS,
  AUTH_PRIMARY_BTN_CLASS,
  AUTH_SECONDARY_BTN_CLASS,
} from "@/components/auth/AuthCard";

export function ResetPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth.resetPassword");
  const tError = useTranslations("auth.error");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { status, establishSession } = usePasswordRecoveryLink(supabase.auth);

  const resetPasswordSchema = z
    .object({
      password: z
        .string()
        .min(8, t("validation.minLength"))
        .regex(/[A-Z]/, t("validation.uppercase"))
        .regex(/[a-z]/, t("validation.lowercase"))
        .regex(/[0-9]/, t("validation.number")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.mismatch"),
      path: ["confirmPassword"],
    });

  type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // The recovery link only signs in now, on explicit submit.
      const sessionError = await establishSession();
      if (sessionError) {
        setLinkError(sessionError);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch {
      setError(tError("generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex w-full items-center justify-center rounded-2xl border border-editorial-line bg-editorial-2 py-16 shadow-2xl shadow-black/40">
        <Icon icon="lucide:loader-2" className="size-8 animate-spin text-editorial-accent" />
      </div>
    );
  }

  if (status === "missing" || linkError) {
    return (
      <AuthCard
        icon="lucide:x-circle"
        iconVariant="danger"
        title={t("invalidLink")}
        description={t("invalidLinkDescription")}
      >
        <p className="text-center text-sm text-editorial-muted">
          {linkError ?? t("noTokenFound")}
        </p>
        <Button asChild className={AUTH_PRIMARY_BTN_CLASS}>
          <Link href="/auth">{t("backToLogin")}</Link>
        </Button>
        <Button asChild variant="outline" className={AUTH_SECONDARY_BTN_CLASS}>
          <Link href="/auth/forgot-password">{t("requestNewLink")}</Link>
        </Button>
      </AuthCard>
    );
  }

  if (success) {
    return (
      <AuthCard
        icon="lucide:check-circle"
        iconVariant="success"
        title={t("success")}
        description={t("successDescription")}
      />
    );
  }

  return (
    <AuthCard icon="lucide:key-round" title={t("title")} description={t("description")}>
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
          <Label htmlFor="password" className={AUTH_LABEL_CLASS}>
            {t("newPassword")}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("newPasswordPlaceholder")}
              {...register("password")}
              className={`${AUTH_INPUT_CLASS} pr-10 ${errors.password ? "border-red-500" : ""}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-0 right-0 h-full px-3 text-editorial-muted hover:bg-transparent hover:text-white"
              onClick={() => setShowPassword(!showPassword)}
            >
              <Icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} className="size-4" />
            </Button>
          </div>
          {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className={AUTH_LABEL_CLASS}>
            {t("confirmPassword")}
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t("confirmPasswordPlaceholder")}
              {...register("confirmPassword")}
              className={`${AUTH_INPUT_CLASS} pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-0 right-0 h-full px-3 text-editorial-muted hover:bg-transparent hover:text-white"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Icon
                icon={showConfirmPassword ? "lucide:eye-off" : "lucide:eye"}
                className="size-4"
              />
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>
        <div className="rounded-xl border border-editorial-line bg-editorial-3 p-3 text-xs text-editorial-muted">
          <p className="font-semibold text-white">{t("requirements.title")}</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            <li>{t("requirements.minLength")}</li>
            <li>{t("requirements.uppercase")}</li>
            <li>{t("requirements.number")}</li>
          </ul>
        </div>
        <Button type="submit" className={AUTH_PRIMARY_BTN_CLASS} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Icon icon="lucide:loader-2" className="mr-2 size-4 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            t("submit")
          )}
        </Button>
      </form>
      <div className="border-t border-editorial-line pt-4 text-center text-sm">
        <Link href="/auth" className={`inline-flex items-center ${AUTH_LINK_CLASS}`}>
          <Icon icon="lucide:arrow-left" className="mr-1 size-4" />
          {t("backToLogin")}
        </Link>
      </div>
    </AuthCard>
  );
}
