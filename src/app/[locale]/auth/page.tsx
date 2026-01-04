"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthForm } from "@/components/AuthForm";
import { AuthLoadingFallback } from "@/components/AuthLoadingFallback";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import Link from "next/link";
import { GameUniverseLogo } from "@/components/ui/game-universe-logo";
import Footer from "@/components/Footer";

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

      {/* Main content avec design arrondi */}
      <div className="flex flex-1 items-center justify-center p-6 py-12">
        <div className="w-full max-w-md">
          <AuthForm mode={mode} onModeChange={setMode} />
        </div>
      </div>

      <Footer />
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
