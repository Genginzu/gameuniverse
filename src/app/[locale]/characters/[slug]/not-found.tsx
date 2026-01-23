"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserX, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CharacterNotFound() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Alert className="border-slate-700 bg-slate-800/50">
          <UserX className="h-4 w-4 text-slate-400" />
          <AlertTitle className="text-white">
            {locale === "fr" ? "Personnage non trouvé" : "Character not found"}
          </AlertTitle>
          <AlertDescription className="mt-2 text-slate-300">
            {locale === "fr"
              ? "Le personnage que vous recherchez n'existe pas ou a été supprimé."
              : "The character you are looking for does not exist or has been removed."}
          </AlertDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Link href={`/${locale}/characters`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {locale === "fr" ? "Retour aux personnages" : "Back to characters"}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Link href={`/${locale}/dashboard`}>
                <Home className="mr-2 h-4 w-4" />
                {locale === "fr" ? "Retour à l'accueil" : "Back to home"}
              </Link>
            </Button>
          </div>
        </Alert>
      </div>
    </div>
  );
}
