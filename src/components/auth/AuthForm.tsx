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
import { Mail, CheckCircle } from "lucide-react";

// Fonction pour traduire les erreurs Supabase
function translateSupabaseError(message: string, t: (key: string) => string): string {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": t("error.invalidCredentials"),
    "Email not confirmed": t("error.emailNotConfirmed"),
    "User already registered": t("error.userAlreadyRegistered"),
    "Password should be at least 6 characters": t("error.passwordTooShort"),
    "Unable to validate email address: invalid format": t("error.invalidEmail"),
    "Email rate limit exceeded": t("error.rateLimitExceeded"),
  };

  // Chercher une correspondance partielle si pas de correspondance exacte
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
    // Clear error when user starts typing
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

        // Si l'utilisateur existe déjà, identities sera vide
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

  // Affichage du message de confirmation après inscription
  if (emailSent) {
    return (
      <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-xs">
        <CardHeader className="space-y-6 pb-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <Mail className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-2xl font-bold text-transparent">
                {t("signup.emailSentTitle")}
              </CardTitle>
            </div>
            <CardDescription className="text-base text-slate-600">
              {t("signup.emailSentDescription")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-600">{t("signup.emailSentTo")}</p>
            <p className="mt-1 font-semibold text-slate-900">{formData.email}</p>
          </div>
          <p className="text-center text-sm text-slate-500">{t("signup.checkSpam")}</p>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-center text-sm text-slate-600">
              {t("signup.alreadyConfirmed")}{" "}
              <button
                type="button"
                onClick={() => {
                  setEmailSent(false);
                  onModeChange("signin");
                }}
                className="font-semibold text-slate-900 transition-colors duration-200 hover:text-purple-700"
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
    <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-xs hover:shadow-2xl">
      <CardHeader className="space-y-6 pb-8">
        <div className="space-y-2 text-center">
          <CardTitle className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent">
            {mode === "signin" ? t("signin.title") : t("signup.title")}
          </CardTitle>
          <CardDescription className="text-base text-slate-600">
            {mode === "signin" ? t("signin.description") : t("signup.description")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "signup" && (
            <div className="space-y-3">
              <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700">
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
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:border-slate-400 focus:bg-white"
              />
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
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
              className="h-12 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:border-slate-400 focus:bg-white"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                {t("form.password")}
              </Label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => (window.location.href = "/auth/forgot-password")}
                  className="text-xs text-slate-500 transition-colors duration-200 hover:text-purple-700"
                >
                  Mot de passe oublié ?
                </button>
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
              className="h-12 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:border-slate-400 focus:bg-white"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-md border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {userAlreadyExists && mode === "signin" && (
            <Alert className="rounded-md border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
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

        <div className="border-t border-slate-100 pt-4">
          <p className="rounded-xl text-center text-sm text-slate-600">
            {mode === "signin" ? t("signin.switchText") : t("signup.switchText")}{" "}
            <button
              type="button"
              onClick={() => onModeChange(mode === "signin" ? "signup" : "signin")}
              className="rounded-xl font-semibold text-slate-900 transition-colors duration-200 hover:text-purple-700"
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
