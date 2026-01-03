"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const t = useTranslations("navigation");

  return (
    <nav className="flex items-center justify-between border-b bg-white p-4 shadow-sm">
      <div className="flex items-center space-x-6">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Game Universe
        </Link>

        <div className="hidden items-center space-x-4 md:flex">
          <Link href="/" className="text-gray-600 transition-colors hover:text-gray-900">
            {t("home")}
          </Link>
          <Link href="/library" className="text-gray-600 transition-colors hover:text-gray-900">
            {t("library")}
          </Link>
          <Link href="/dashboard" className="text-gray-600 transition-colors hover:text-gray-900">
            {t("dashboard")}
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <LanguageSwitcher />

        <div className="flex items-center space-x-2">
          <Button variant="ghost" asChild>
            <Link href="/auth/signin">{t("login")}</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/signup">{t("signup")}</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
