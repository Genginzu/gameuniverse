"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle, XCircle, KeyRound } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { GameUniverseLogo } from "@/components/ui/game-universe-logo";
import Footer from "@/components/shared/Footer";
import { useTranslations } from "next-intl";

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  useEffect(() => {
    const handleRecovery = async () => {
      // Vérifier d'abord les hash params (flow standard)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (accessToken && refreshToken && type === "recovery") {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError(sessionError.message);
          setIsLoading(false);
          return;
        }

        window.history.replaceState(null, "", window.location.pathname);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Vérifier les query params (token_hash flow)
      const queryParams = new URLSearchParams(window.location.search);
      const tokenHash = queryParams.get("token_hash");
      const queryType = queryParams.get("type");

      if (tokenHash && queryType === "recovery") {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

        if (verifyError) {
          setError(verifyError.message);
          setIsLoading(false);
          return;
        }

        window.history.replaceState(null, "", window.location.pathname);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Vérifier si déjà authentifié
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
      } else {
        setError(t("noTokenFound"));
      }
      setIsLoading(false);
    };

    handleRecovery();
  }, [supabase.auth, t]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(tError("generic"));
      console.error("Reset password error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/5 to-slate-800/5 backdrop-blur-sm"></div>
        <div className="relative flex items-center justify-between p-6">
          <Link href="/" className="flex items-center space-x-3">
            <GameUniverseLogo size="md" />
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-xl font-bold text-transparent">
              Game Universe
            </span>
          </Link>
          <div className="rounded-2xl backdrop-blur-sm">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-6 py-12">
        <div className="w-full max-w-md">
          {isLoading ? (
            <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-sm">
              <CardContent className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </CardContent>
            </Card>
          ) : error && !isAuthenticated ? (
            <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-sm">
              <CardHeader className="space-y-6 pb-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="space-y-2 text-center">
                  <CardTitle className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-3xl font-bold text-transparent">
                    {t("invalidLink")}
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600">
                    {t("invalidLinkDescription")}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-sm text-slate-600">{error}</p>
                <Button
                  asChild
                  className="h-12 w-full rounded-xl border-2 bg-gradient-to-br from-blue-500 via-purple-600 to-purple-700 font-semibold text-white shadow-lg"
                >
                  <Link href="/auth">{t("backToLogin")}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 w-full rounded-xl border-slate-200 font-semibold"
                >
                  <Link href="/auth/forgot-password">{t("requestNewLink")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : success ? (
            <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-sm">
              <CardHeader className="space-y-6 pb-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2 text-center">
                  <CardTitle className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-3xl font-bold text-transparent">
                    {t("success")}
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600">
                    {t("successDescription")}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ) : (
            <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-sm">
              <CardHeader className="space-y-6 pb-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                  <KeyRound className="h-8 w-8 text-purple-600" />
                </div>
                <div className="space-y-2 text-center">
                  <CardTitle className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent">
                    {t("title")}
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600">
                    {t("description")}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {error && (
                    <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                      {t("newPassword")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("newPasswordPlaceholder")}
                        {...register("password")}
                        className={`h-12 rounded-xl border-slate-200 bg-slate-50/50 pr-10 transition-all duration-200 focus:border-slate-400 focus:bg-white ${errors.password ? "border-red-500" : ""}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-semibold text-slate-700"
                    >
                      {t("confirmPassword")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t("confirmPasswordPlaceholder")}
                        {...register("confirmPassword")}
                        className={`h-12 rounded-xl border-slate-200 bg-slate-50/50 pr-10 transition-all duration-200 focus:border-slate-400 focus:bg-white ${errors.confirmPassword ? "border-red-500" : ""}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">{t("requirements.title")}</p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                      <li>{t("requirements.minLength")}</li>
                      <li>{t("requirements.uppercase")}</li>
                      <li>{t("requirements.number")}</li>
                    </ul>
                  </div>
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl border-2 border-transparent bg-gradient-to-br from-blue-500 via-purple-600 to-purple-700 font-semibold text-white shadow-lg transition-all duration-200 hover:border-purple-500 hover:from-white hover:via-white hover:to-white hover:text-purple-700 hover:shadow-xl"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("submitting")}
                      </>
                    ) : (
                      t("submit")
                    )}
                  </Button>
                </form>
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-center text-sm text-slate-600">
                    <Link
                      href="/auth"
                      className="inline-flex items-center font-semibold text-slate-900 transition-colors duration-200 hover:text-purple-700"
                    >
                      <ArrowLeft className="mr-1 h-4 w-4" />
                      {t("backToLogin")}
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
