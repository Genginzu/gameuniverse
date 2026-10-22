"use client";

import { useTranslations as useNextIntlTranslations, useLocale } from "next-intl";

// Custom hook for review translations
export function useReviewTranslations() {
  return useNextIntlTranslations("gameDetails.reviews");
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
