"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AuthForm } from "@/components/AuthForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function AuthPage() {
  const t = useTranslations("auth");
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header with language switcher */}
      <header className="flex items-center justify-between p-4">
        <div className="text-2xl font-bold text-slate-800">Game Universe</div>
        <LanguageSwitcher />
      </header>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AuthForm mode={mode} onModeChange={setMode} />
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-slate-600">
        <p>{t("footer.text")}</p>
      </footer>
    </div>
  );
}
