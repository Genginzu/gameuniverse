"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    } catch (err: any) {
      setError(err.message || t("error.generic"));
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
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl">
          {mode === "signin" ? t("signin.title") : t("signup.title")}
        </CardTitle>
        <CardDescription className="text-center">
          {mode === "signin" ? t("signin.description") : t("signup.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("form.fullName")}</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder={t("form.fullNamePlaceholder")}
                value={formData.fullName}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t("form.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("form.emailPlaceholder")}
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("form.password")}</Label>
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
            />
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <Button
            type="submit"
            className="w-full"
            disabled={!isFormValid() || isSubmitting || loading}
          >
            {isSubmitting
              ? t("form.submitting")
              : mode === "signin"
                ? t("signin.submit")
                : t("signup.submit")}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {mode === "signin" ? t("signin.switchText") : t("signup.switchText")}{" "}
            <button
              type="button"
              onClick={() => onModeChange(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-primary hover:underline"
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
