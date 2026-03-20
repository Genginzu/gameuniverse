"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";


export function AuthErrorHandler() {
  const { forceSignOut } = useAuth();
  const t = useTranslations("auth");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Écouter les erreurs globales d'authentification
    const handleError = (event: ErrorEvent) => {
      const error = event.error;

      if (
        error?.message?.includes("refresh") ||
        error?.message?.includes("Invalid Refresh Token") ||
        error?.message?.includes("Refresh Token Not Found")
      ) {
        setShowError(true);

        // Auto-déconnexion après 5 secondes
        setTimeout(() => {
          forceSignOut();
        }, 5000);
      }
    };

    // Écouter les promesses rejetées
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;

      if (
        error?.message?.includes("refresh") ||
        error?.message?.includes("Invalid Refresh Token") ||
        error?.message?.includes("Refresh Token Not Found")
      ) {
        setShowError(true);
        event.preventDefault(); // Empêcher l'affichage de l'erreur dans la console

        // Auto-déconnexion après 5 secondes
        setTimeout(() => {
          forceSignOut();
        }, 5000);
      }
    };

    // Écouter les erreurs non gérées
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [forceSignOut]);

  if (!showError) return null;

  return (
    <div className="fixed right-6 top-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
      <Alert
        variant="destructive"
        className="relative rounded-2xl border-0 bg-red-50/95 shadow-2xl backdrop-blur-sm"
      >
        <Icon icon="ion:warning" className="h-5 w-5 text-red-600"  />
        <AlertDescription className="pr-10">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-red-800">
                {t("error.sessionExpired", {
                  defaultValue: "Session expirée",
                })}
              </p>
              <p className="text-xs leading-relaxed text-red-700/80">
                {t("error.sessionExpiredDescription", {
                  defaultValue:
                    "Votre session a expiré. Vous allez être déconnecté automatiquement dans quelques secondes.",
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowError(false)}
                className="h-8 rounded-xl border-red-200 bg-white/80 text-xs text-red-700 hover:bg-white hover:text-red-800"
              >
                {t("error.dismiss", { defaultValue: "Ignorer" })}
              </Button>
              <Button
                size="sm"
                onClick={forceSignOut}
                className="h-8 rounded-xl bg-red-600 text-xs text-white shadow-lg hover:bg-red-700"
              >
                {t("error.signOutNow", { defaultValue: "Se déconnecter" })}
              </Button>
            </div>
          </div>
        </AlertDescription>
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 h-7 w-7 rounded-xl p-0 text-red-600 hover:bg-red-100/50 hover:text-red-700"
          onClick={() => setShowError(false)}
        >
          <Icon icon="ion:close" className="h-4 w-4"  />
        </Button>
      </Alert>
    </div>
  );
}
