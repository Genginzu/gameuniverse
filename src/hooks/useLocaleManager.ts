"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export function useLocaleManager() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const changeLocale = (newLocale: string) => {
    // Set cookie for locale preference
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Navigate to the same page with new locale
    const segments = pathname.split("/");

    // Remove current locale if present
    if (segments[1] === "fr" || segments[1] === "en") {
      segments.splice(1, 1);
    }

    // Add new locale if not default (fr)
    if (newLocale !== "fr") {
      segments.splice(1, 0, newLocale);
    }

    const newPath = segments.join("/") || "/";
    router.push(newPath);
    router.refresh();
  };

  const getLocalizedPath = (path: string, targetLocale?: string) => {
    const targetLoc = targetLocale || locale;

    // Remove leading slash if present
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    // If target locale is default (fr), don't add locale prefix
    if (targetLoc === "fr") {
      return `/${cleanPath}`;
    }

    return `/${targetLoc}/${cleanPath}`;
  };

  const isDefaultLocale = locale === "fr";

  const availableLocales = [
    { code: "fr", name: "Français", flag: "🇫🇷", isDefault: true },
    { code: "en", name: "English", flag: "🇺🇸", isDefault: false },
  ];

  return {
    currentLocale: locale,
    isDefaultLocale,
    availableLocales,
    changeLocale,
    getLocalizedPath,
  };
}
