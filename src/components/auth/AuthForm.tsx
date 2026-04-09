"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { AuthMode } from "@/types/auth";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";

function translateSupabaseError(message: string, t: (key: string) => string): string {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": t("error.invalidCredentials"),
    "Email not confirmed": t("error.emailNotConfirmed"),
    "User already registered": t("error.userAlreadyRegistered"),
    "Password should be at least 6 characters": t("error.passwordTooShort"),
    "Unable to validate email address: invalid format": t("error.invalidEmail"),
    "Email rate limit exceeded": t("error.rateLimitExceeded"),
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return message;
}

interface AuthFormProps {
  mode: AuthMode;
  onModeChange: (_newMode: AuthMode) => void;
}

export function AuthForm({ mode, onModeChange }: AuthFormProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { signIn, signUp, loading: _loading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userAlreadyExists, setUserAlreadyExists] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === "signin") {
        await signIn(formData.email, formData.password);
      } else {
        const result = await signUp(formData.email, formData.password, formData.fullName, locale);

        if (result.user && result.user.identities && result.user.identities.length === 0) {
          setUserAlreadyExists(true);
          onModeChange("signin");
        } else {
          setEmailSent(true);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("error.generic");
      setError(translateSupabaseError(errorMessage, t));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    if (mode === "signin") {
      return formData.email && formData.password;
    }
    return formData.email && formData.password && formData.fullName;
  };

  if (emailSent) {
    return (
      <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-xs dark:bg-slate-800/95">
        <CardHeader className="space-y-6 pb-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
              <Icon icon="lucide:mail" className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Icon
                icon="lucide:check-circle"
                className="h-5 w-5 text-green-600 dark:text-green-400"
              />
              <CardTitle className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-2xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
                {t("signup.emailSentTitle")}
              </CardTitle>
            </div>
            <CardDescription className="text-base text-slate-600 dark:text-slate-400">
              {t("signup.emailSentDescription")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-700/50">
            <p className="text-sm text-slate-600 dark:text-slate-400">{t("signup.emailSentTo")}</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
              {formData.email}
            </p>
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {t("signup.checkSpam")}
          </p>
          <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              {t("signup.alreadyConfirmed")}{" "}
              <button
                type="button"
                onClick={() => {
                  setEmailSent(false);
                  onModeChange("signin");
                }}
                className="font-semibold text-slate-900 transition-colors duration-200 hover:text-purple-700 dark:text-slate-100 dark:hover:text-purple-400"
              >
                {t("signin.title")}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-xs hover:shadow-2xl dark:bg-slate-800/95">
      <CardHeader className="space-y-6 pb-8">
        <div className="space-y-2 text-center">
          <CardTitle className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
            {mode === "signin" ? t("signin.title") : t("signup.title")}
          </CardTitle>
          <CardDescription className="text-base text-slate-600 dark:text-slate-400">
            {mode === "signin" ? t("signin.description") : t("signup.description")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "signup" && (
            <div className="space-y-3">
              <Label
                htmlFor="fullName"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                {t("form.fullName")}
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder={t("form.fullNamePlaceholder")}
                value={formData.fullName}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 text-base transition-all duration-200 focus:border-slate-400 focus:bg-white dark:border-slate-600 dark:bg-slate-700/50 dark:focus:border-slate-500 dark:focus:bg-slate-700"
              />
            </div>
          )}

          <div className="space-y-3">
            <Label
              htmlFor="email"
              className="text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              {t("form.email")}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("form.emailPlaceholder")}
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              className="h-12 rounded-xl border-slate-200 bg-slate-50/50 text-base transition-all duration-200 focus:border-slate-400 focus:bg-white dark:border-slate-600 dark:bg-slate-700/50 dark:focus:border-slate-500 dark:focus:bg-slate-700"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                {t("form.password")}
              </Label>
              {mode === "signin" && (
                <Link
                  href="/auth/forgot-password"
                  className="inline-flex min-h-[44px] items-center text-xs text-slate-500 transition-colors duration-200 hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-400"
                >
                  {t("forgotPassword.forgotPasswordLink")}
                </Link>
              )}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={t("form.passwordPlaceholder")}
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              minLength={6}
              className="h-12 rounded-xl border-slate-200 bg-slate-50/50 text-base transition-all duration-200 focus:border-slate-400 focus:bg-white dark:border-slate-600 dark:bg-slate-700/50 dark:focus:border-slate-500 dark:focus:bg-slate-700"
            />
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="rounded-md border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30"
            >
              <AlertDescription className="text-red-800 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {userAlreadyExists && mode === "signin" && (
            <Alert className="rounded-md border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30">
              <AlertDescription className="text-blue-800 dark:text-blue-300">
                {t("signup.userAlreadyExists")}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-xl border-2 border-transparent bg-linear-to-br from-blue-500 via-purple-600 to-purple-700 font-semibold text-white shadow-lg transition-all duration-200 hover:border-purple-500 hover:from-white hover:via-white hover:to-white hover:text-purple-700 hover:shadow-xl"
            disabled={!isFormValid() || isSubmitting}
          >
            {isSubmitting && <Spinner size="sm" className="mr-2" />}
            {isSubmitting
              ? t("form.submitting")
              : mode === "signin"
                ? t("signin.submit")
                : t("signup.submit")}
          </Button>
        </form>

        <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
          <p className="rounded-xl text-center text-sm text-slate-600 dark:text-slate-400">
            {mode === "signin" ? t("signin.switchText") : t("signup.switchText")}{" "}
            <button
              type="button"
              onClick={() => onModeChange(mode === "signin" ? "signup" : "signin")}
              className="rounded-xl font-semibold text-slate-900 transition-colors duration-200 hover:text-purple-700 dark:text-slate-100 dark:hover:text-purple-400"
              disabled={isSubmitting}
            >
              {mode === "signin" ? t("signin.switchLink") : t("signup.switchLink")}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
