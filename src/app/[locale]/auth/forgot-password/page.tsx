"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { GameUniverseLogo } from "@/components/ui/game-universe-logo";
import Footer from "@/components/shared/Footer";

const forgotPasswordSchema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const supabase = createClient();

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
        redirectTo: `${window.location.origin}/fr/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
      console.error("Forgot password error:", err);
    } finally {
      setIsLoading(false);
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
          {success ? (
            <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-sm">
              <CardHeader className="space-y-6 pb-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2 text-center">
                  <CardTitle className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-3xl font-bold text-transparent">
                    Email envoyé !
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600">
                    Vérifiez votre boîte de réception
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2 text-center">
                  <p className="text-sm text-slate-600">
                    Nous avons envoyé un lien de réinitialisation à :
                  </p>
                  <p className="font-semibold text-slate-900">{email}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <h4 className="mb-2 font-semibold text-slate-700">Étapes suivantes :</h4>
                  <ol className="list-inside list-decimal space-y-1 text-sm text-slate-600">
                    <li>Vérifiez votre boîte de réception</li>
                    <li>Cliquez sur le lien dans l&apos;email</li>
                    <li>Créez votre nouveau mot de passe</li>
                  </ol>
                </div>
                <div className="text-center text-xs text-slate-500">
                  <p>Vous ne voyez pas l&apos;email ? Vérifiez vos spams ou</p>
                  <button
                    type="button"
                    className="font-semibold text-slate-900 transition-colors duration-200 hover:text-purple-700"
                    onClick={() => setSuccess(false)}
                  >
                    essayez avec une autre adresse
                  </button>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 w-full rounded-xl border-slate-200 font-semibold"
                  >
                    <Link href="/auth">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Retour à la connexion
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-sm">
              <CardHeader className="space-y-6 pb-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                  <Mail className="h-8 w-8 text-purple-600" />
                </div>
                <div className="space-y-2 text-center">
                  <CardTitle className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent">
                    Mot de passe oublié ?
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600">
                    Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser
                    votre mot de passe.
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
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      Adresse email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      {...register("email")}
                      className={`h-12 rounded-xl border-slate-200 bg-slate-50/50 transition-all duration-200 focus:border-slate-400 focus:bg-white ${errors.email ? "border-red-500" : ""}`}
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  </div>
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl border-2 bg-gradient-to-br from-blue-500 via-purple-600 to-purple-700 font-semibold text-white shadow-lg transition-all duration-200 hover:border-purple-700 hover:bg-none hover:text-black hover:shadow-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Envoyer le lien
                      </>
                    )}
                  </Button>
                </form>
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-center text-sm text-slate-600">
                    Vous vous souvenez de votre mot de passe ?{" "}
                    <Link
                      href="/auth"
                      className="font-semibold text-slate-900 transition-colors duration-200 hover:text-purple-700"
                    >
                      Se connecter
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
