"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { AuthMode } from "@/types/auth";
import { Link } from "@/i18n/navigation";
import {
  AuthCard,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_LINK_CLASS,
  AUTH_PRIMARY_BTN_CLASS,
} from "@/components/auth/AuthCard";

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
      <AuthCard
        icon="lucide:mail-check"
        iconVariant="success"
        title={t("signup.emailSentTitle")}
        description={t("signup.emailSentDescription")}
      >
        <div className="rounded-xl border border-editorial-line bg-editorial-3 p-4 text-center">
          <p className="text-sm text-editorial-muted">{t("signup.emailSentTo")}</p>
          <p className="mt-1 font-semibold text-white">{formData.email}</p>
        </div>
        <p className="text-center text-sm text-editorial-muted">{t("signup.checkSpam")}</p>
        <div className="border-t border-editorial-line pt-4 text-center text-sm text-editorial-muted">
          {t("signup.alreadyConfirmed")}{" "}
          <button
            type="button"
            onClick={() => {
              setEmailSent(false);
              onModeChange("signin");
            }}
            className={AUTH_LINK_CLASS}
          >
            {t("signin.title")}
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={mode === "signin" ? t("signin.title") : t("signup.title")}
      description={mode === "signin" ? t("signin.description") : t("signup.description")}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="fullName" className={AUTH_LABEL_CLASS}>
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
              className={AUTH_INPUT_CLASS}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className={AUTH_LABEL_CLASS}>
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
            className={AUTH_INPUT_CLASS}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className={AUTH_LABEL_CLASS}>
              {t("form.password")}
            </Label>
            {mode === "signin" && (
              <Link
                href="/auth/forgot-password"
                className="inline-flex min-h-[44px] items-center text-xs text-editorial-muted transition-colors hover:text-white"
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
            className={AUTH_INPUT_CLASS}
          />
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="rounded-xl border-red-500/30 bg-red-500/10 text-red-300"
          >
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {userAlreadyExists && mode === "signin" && (
          <Alert className="rounded-xl border-sky-500/30 bg-sky-500/10">
            <AlertDescription className="text-sky-300">
              {t("signup.userAlreadyExists")}
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" className={AUTH_PRIMARY_BTN_CLASS} disabled={!isFormValid() || isSubmitting}>
          {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
          {isSubmitting
            ? t("form.submitting")
            : mode === "signin"
              ? t("signin.submit")
              : t("signup.submit")}
        </Button>
      </form>

      <div className="border-t border-editorial-line pt-4 text-center text-sm text-editorial-muted">
        {mode === "signin" ? t("signin.switchText") : t("signup.switchText")}{" "}
        <button
          type="button"
          onClick={() => onModeChange(mode === "signin" ? "signup" : "signin")}
          className={AUTH_LINK_CLASS}
          disabled={isSubmitting}
        >
          {mode === "signin" ? t("signin.switchLink") : t("signup.switchLink")}
        </button>
      </div>
    </AuthCard>
  );
}
