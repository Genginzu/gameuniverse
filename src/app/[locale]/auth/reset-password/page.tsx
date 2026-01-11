import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from "next/link";

interface ResetPasswordPageProps {
  searchParams: {
    token?: string;
    type?: string;
    error?: string;
  };
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
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
            <CardTitle className="text-red-600">Erreur de réinitialisation</CardTitle>
            <CardDescription>
              Une erreur s'est produite lors de la réinitialisation de votre mot de passe.
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
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: searchParams.token,
      type: "recovery",
    });

    if (error) {
      console.error("Reset password token error:", error);
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <Card className="mx-auto w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-600">Lien invalide</CardTitle>
              <CardDescription>
                Le lien de réinitialisation est invalide ou a expiré.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">{error.message}</p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/auth">Retour à la connexion</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/auth/forgot-password">Demander un nouveau lien</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Token valide - afficher le formulaire de réinitialisation
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Nouveau mot de passe</CardTitle>
            <CardDescription>
              Choisissez un nouveau mot de passe sécurisé pour votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm />
          </CardContent>
        </Card>
      </div>
    );
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
