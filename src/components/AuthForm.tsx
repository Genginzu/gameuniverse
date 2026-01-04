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

interface AuthFormProps {
  mode: "signin" | "signup";
  onModeChange: (mode: "signin" | "signup") => void;
}

export function AuthForm({ mode, onModeChange }: AuthFormProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { signIn, signUp, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        await signUp(formData.email, formData.password, formData.fullName, locale);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("error.generic");
      setError(errorMessage);
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

  return (
    <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-sm">
      <CardHeader className="space-y-6 pb-8">
        <div className="space-y-2 text-center">
          <CardTitle className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent">
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
            <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
              {t("form.password")}
            </Label>
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
            <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 font-semibold text-white shadow-lg transition-all duration-200 hover:from-slate-800 hover:to-slate-700 hover:shadow-xl"
            disabled={!isFormValid() || isSubmitting || loading}
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
          <p className="text-center text-sm text-slate-600">
            {mode === "signin" ? t("signin.switchText") : t("signup.switchText")}{" "}
            <button
              type="button"
              onClick={() => onModeChange(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-slate-900 transition-colors duration-200 hover:text-slate-700"
              disabled={isSubmitting}
            >
              {mode === "signin" ? t("signup.switchLink") : t("signin.switchLink")}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
