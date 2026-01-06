"use client";

import { useTranslations, useLocale } from "next-intl";
import { LandingHeader } from "@/components/layout/landing/LandingHeader";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import {
  useCommonTranslations,
  useNavigationTranslations,
  useCurrentLocale,
  useDateFormatter,
  useNumberFormatter,
} from "@/hooks/useTranslations";
import { Button } from "@/components/ui/button";

export default function TestI18nPage() {
  const t = useTranslations();
  const tCommon = useCommonTranslations();
  const tNav = useNavigationTranslations();
  const locale = useLocale();
  const { isDefault, isFrench, isEnglish } = useCurrentLocale();
  const { formatDate, formatShortDate, formatRelativeTime } = useDateFormatter();
  const { formatCurrency, formatNumber, formatPercent } = useNumberFormatter();

  const testDate = new Date("2024-12-25");
  const testPrice = 59.99;
  const testNumber = 1234567.89;
  const testPercent = 0.75;

  return (
    <>
      <LandingHeader />
      <main className="container mx-auto p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-3xl font-bold">Internationalization Test Page</h1>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Locale Information */}
            <div className="rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">Locale Information</h2>
              <div className="space-y-2">
                <p>
                  <strong>Current Locale:</strong> {locale}
                </p>
                <p>
                  <strong>Is Default:</strong> {isDefault ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Is French:</strong> {isFrench ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Is English:</strong> {isEnglish ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {/* Language Switcher Test */}
            <div className="rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">Language Switcher</h2>
              <div className="space-y-4">
                <p>Change language using the switcher below:</p>
                <LanguageSwitcher />
                <p className="text-sm text-muted-foreground">
                  The page should update immediately when you change the language.
                </p>
              </div>
            </div>

            {/* Navigation Translations */}
            <div className="rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">Navigation Translations</h2>
              <div className="space-y-2">
                <p>
                  <strong>Home:</strong> {tNav("home")}
                </p>
                <p>
                  <strong>Library:</strong> {tNav("library")}
                </p>
                <p>
                  <strong>Dashboard:</strong> {tNav("dashboard")}
                </p>
                <p>
                  <strong>Login:</strong> {tNav("login")}
                </p>
                <p>
                  <strong>Signup:</strong> {tNav("signup")}
                </p>
              </div>
            </div>

            {/* Common Translations */}
            <div className="rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">Common Translations</h2>
              <div className="space-y-2">
                <p>
                  <strong>Loading:</strong> {tCommon("loading")}
                </p>
                <p>
                  <strong>Error:</strong> {tCommon("error")}
                </p>
                <p>
                  <strong>Save:</strong> {tCommon("save")}
                </p>
                <p>
                  <strong>Cancel:</strong> {tCommon("cancel")}
                </p>
                <p>
                  <strong>Language:</strong> {tCommon("language")}
                </p>
              </div>
            </div>

            {/* Date Formatting */}
            <div className="rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">Date Formatting</h2>
              <div className="space-y-2">
                <p>
                  <strong>Full Date:</strong> {formatDate(testDate)}
                </p>
                <p>
                  <strong>Short Date:</strong> {formatShortDate(testDate)}
                </p>
                <p>
                  <strong>Relative Time:</strong> {formatRelativeTime(testDate)}
                </p>
              </div>
            </div>

            {/* Number Formatting */}
            <div className="rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">Number Formatting</h2>
              <div className="space-y-2">
                <p>
                  <strong>Currency:</strong> {formatCurrency(testPrice)}
                </p>
                <p>
                  <strong>Number:</strong> {formatNumber(testNumber)}
                </p>
                <p>
                  <strong>Percent:</strong> {formatPercent(testPercent)}
                </p>
              </div>
            </div>

            {/* Landing Page Translations */}
            <div className="rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">Landing Page Translations</h2>
              <div className="space-y-2">
                <p>
                  <strong>Title:</strong> {t("landing.title")}
                </p>
                <p>
                  <strong>Subtitle:</strong> {t("landing.subtitle")}
                </p>
                <p>
                  <strong>CTA Signup:</strong> {t("landing.cta.signup")}
                </p>
                <p>
                  <strong>CTA Login:</strong> {t("landing.cta.login")}
                </p>
              </div>
            </div>

            {/* Library Translations */}
            <div className="rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">Library Translations</h2>
              <div className="space-y-2">
                <p>
                  <strong>Title:</strong> {t("library.title")}
                </p>
                <p>
                  <strong>Search:</strong> {t("library.search")}
                </p>
                <p>
                  <strong>Filters:</strong> {t("library.filters")}
                </p>
                <p>
                  <strong>No Results:</strong> {t("library.noResults")}
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Language Change Test */}
          <div className="mt-8 rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">Real-time Language Change Test</h2>
            <p className="mb-4">
              Use the language switcher in the navigation or below to test real-time updates:
            </p>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <Button variant="outline">{tCommon("save")}</Button>
              <Button variant="outline">{tCommon("cancel")}</Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              All text on this page should update immediately when you change the language.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
