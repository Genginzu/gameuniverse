"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations, useLocale } from "next-intl";

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
      <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-xs dark:bg-slate-800/95">
        <CardHeader className="space-y-6 pb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Icon
              icon="lucide:check-circle"
              className="h-8 w-8 text-green-600 dark:text-green-400"
            />
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="bg-linear-to-r from-green-600 to-green-500 bg-clip-text text-3xl font-bold text-transparent">
              {t("successTitle")}
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-400">
              {t("successSubtitle")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">{t("successSentTo")}</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{email}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
            <h4 className="mb-2 font-semibold text-slate-700 dark:text-slate-300">
              {t("successStepsTitle")}
            </h4>
            <ol className="list-inside list-decimal space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>{t("successStep1")}</li>
              <li>{t("successStep2")}</li>
              <li>{t("successStep3")}</li>
            </ol>
          </div>
          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            <p>{t("successSpam")}</p>
            <button
              type="button"
              className="font-semibold text-slate-900 transition-colors duration-200 hover:text-purple-700 dark:text-slate-100 dark:hover:text-purple-400"
              onClick={() => setSuccess(false)}
            >
              {t("successRetry")}
            </button>
          </div>
          <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
            <Button
              asChild
              variant="outline"
              className="h-12 w-full rounded-xl border-slate-200 font-semibold dark:border-slate-600"
            >
              <Link href="/auth">
                <Icon icon="lucide:arrow-left" className="mr-2 h-4 w-4" />
                {t("backToLogin")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-xs dark:bg-slate-800/95">
      <CardHeader className="space-y-6 pb-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
          <Icon icon="lucide:mail" className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="space-y-2 text-center">
          <CardTitle className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-base text-slate-600 dark:text-slate-400">
            {t("description")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <Alert
              variant="destructive"
              className="rounded-xl border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30"
            >
              <AlertDescription className="text-red-800 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-3">
            <Label
              htmlFor="email"
              className="text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              {t("emailLabel")}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              {...register("email")}
              className={`h-12 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:border-slate-400 focus:bg-white dark:border-slate-600 dark:bg-slate-700/50 dark:focus:border-slate-500 dark:focus:bg-slate-700 ${errors.email ? "border-red-500" : ""}`}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <Button
            type="submit"
            className="h-12 w-full rounded-xl border-2 border-transparent bg-linear-to-br from-blue-500 via-purple-600 to-purple-700 font-semibold text-white shadow-lg transition-all duration-200 hover:border-purple-500 hover:from-white hover:via-white hover:to-white hover:text-purple-700 hover:shadow-xl"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icon icon="lucide:loader-2" className="mr-2 h-4 w-4 animate-spin" />
                {t("submitting")}
              </>
            ) : (
              <>
                <Icon icon="lucide:mail" className="mr-2 h-4 w-4" />
                {t("submit")}
              </>
            )}
          </Button>
        </form>
        <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            {t("rememberPassword")}{" "}
            <Link
              href="/auth"
              className="font-semibold text-slate-900 transition-colors duration-200 hover:text-purple-700 dark:text-slate-100 dark:hover:text-purple-400"
            >
              {t("backToLogin")}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
