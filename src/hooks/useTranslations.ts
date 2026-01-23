"use client";

import { useTranslations as useNextIntlTranslations, useLocale } from "next-intl";

// Custom hook for common translations
export function useCommonTranslations() {
  return useNextIntlTranslations("common");
}

// Custom hook for navigation translations
export function useNavigationTranslations() {
  return useNextIntlTranslations("navigation");
}

// Custom hook for library translations
export function useLibraryTranslations() {
  return useNextIntlTranslations("library");
}

// Custom hook for game translations
export function useGameTranslations() {
  return useNextIntlTranslations("game");
}

// Custom hook for character translations
export function useCharacterTranslations() {
  return useNextIntlTranslations("characters");
}

// Custom hook for auth translations
export function useAuthTranslations() {
  return useNextIntlTranslations("auth");
}

// Custom hook for dashboard translations
export function useDashboardTranslations() {
  return useNextIntlTranslations("dashboard");
}

// Custom hook for landing page translations
export function useLandingTranslations() {
  return useNextIntlTranslations("landing");
}

// Custom hook for pagination translations
export function usePaginationTranslations() {
  return useNextIntlTranslations("pagination");
}

// Custom hook to get current locale with additional utilities
export function useCurrentLocale() {
  const locale = useLocale();

  return {
    locale,
    isDefault: locale === "fr",
    isFrench: locale === "fr",
    isEnglish: locale === "en",
  };
}

// Custom hook for formatting dates according to locale
export function useDateFormatter() {
  const locale = useLocale();

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  };

  const formatShortDate = (date: Date | string) => {
    return formatDate(date, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRelativeTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const diffInDays = Math.floor((dateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (Math.abs(diffInDays) < 1) {
      return rtf.format(0, "day");
    } else if (Math.abs(diffInDays) < 7) {
      return rtf.format(diffInDays, "day");
    } else if (Math.abs(diffInDays) < 30) {
      return rtf.format(Math.floor(diffInDays / 7), "week");
    } else if (Math.abs(diffInDays) < 365) {
      return rtf.format(Math.floor(diffInDays / 30), "month");
    } else {
      return rtf.format(Math.floor(diffInDays / 365), "year");
    }
  };

  return {
    formatDate,
    formatShortDate,
    formatRelativeTime,
  };
}

// Custom hook for formatting numbers according to locale
export function useNumberFormatter() {
  const locale = useLocale();

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale, options).format(number);
  };

  const formatCurrency = (amount: number, currency = "EUR") => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value);
  };

  return {
    formatNumber,
    formatCurrency,
    formatPercent,
  };
}
