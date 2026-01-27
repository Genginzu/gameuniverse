import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from "next/link";
import type { EmailOtpType } from "@supabase/supabase-js";

interface ConfirmPageProps {
  searchParams: {
    token?: string;
    type?: string;
    redirect_to?: string;
    error?: string;
  };
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const supabase = await createServerClient();

  // Si il y a une erreur dans les paramètres
  if (searchParams.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Erreur de confirmation</CardTitle>
            <CardDescription>
              Une erreur s'est produite lors de la confirmation de votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">{searchParams.error}</p>
            <Button asChild>
              <Link href="/auth">Retour à la connexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si pas de token, rediriger vers la page d'auth
  if (!searchParams.token) {
    redirect("/auth");
  }

  try {
    // Vérifier le token avec Supabase
    const { error } = await supabase.auth.verifyOtp({
      token_hash: searchParams.token,
      type: (searchParams.type as EmailOtpType) || "signup",
    });

    if (error) {
      console.error("Confirmation error:", error);
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <Card className="mx-auto w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-600">Confirmation échouée</CardTitle>
              <CardDescription>Le lien de confirmation est invalide ou a expiré.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">{error.message}</p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/auth">Retour à la connexion</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/auth/resend">Renvoyer l'email</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Succès - rediriger vers la destination
    const redirectTo = searchParams.redirect_to || "/dashboard";
    redirect(redirectTo);
  } catch (error) {
    console.error("Unexpected error:", error);
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Erreur inattendue</CardTitle>
            <CardDescription>Une erreur inattendue s'est produite.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/auth">Retour à la connexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}
