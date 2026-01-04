"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthForm } from "@/components/AuthForm";
import { AuthLoadingFallback } from "@/components/AuthLoadingFallback";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

function AuthContent() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "signup" || modeParam === "signin") {
      setMode(modeParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header avec design arrondi */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/5 to-slate-800/5 backdrop-blur-sm"></div>
        <div className="relative flex items-center justify-between p-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700">
              <span className="text-lg font-bold text-white">G</span>
            </div>
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-2xl font-bold text-transparent">
              Game Universe
            </div>
          </div>
          <div className="rounded-2xl bg-white/80 p-1 shadow-lg backdrop-blur-sm">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main content avec design arrondi */}
      <div className="flex flex-1 items-center justify-center p-6 pt-12">
        <div className="w-full max-w-md">
          <AuthForm mode={mode} onModeChange={setMode} />
        </div>
      </div>

      {/* Footer avec design arrondi */}
      <footer className="p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-white/20 bg-white/60 p-6 shadow-lg backdrop-blur-sm">
            <p className="text-center text-sm font-medium text-slate-600">{t("footer.text")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <AuthContent />
    </Suspense>
  );
}
