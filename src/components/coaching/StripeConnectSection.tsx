"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";
import { PaymentHistory } from "./PaymentHistory";

interface StripeStatus {
  hasAccount: boolean;
  onboardingComplete: boolean;
  dashboardUrl: string | null;
}

export function StripeConnectSection() {
  const t = useTranslations("coaching.settings.stripe");
  const { data, isLoading } = useSWR<StripeStatus>("/api/coaching/stripe/connect", fetcher);
  const [loading, setLoading] = useState(false);

  const startOnboarding = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coaching/stripe/connect", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return (
    <div className="glass-card flex items-center gap-3 rounded-xl p-6">
      <Icon icon="lucide:loader-2" className="size-5 animate-spin text-palette-secondary-400" />
      <span className="text-sm text-gray-500 dark:text-gray-400">{t("checking")}</span>
    </div>
  );

  return (
  <>
    <div className="glass-card space-y-4 rounded-xl p-6">
      <div className="flex items-center gap-3">
        <Icon icon="lucide:credit-card" className="size-5 text-palette-secondary-400" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t("title")}</h2>
      </div>

      {!data?.hasAccount ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("notConnected")}</p>
          <button onClick={startOnboarding} disabled={loading} className="w-full rounded-lg bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto">
            {loading ? t("connecting") : t("connect")}
          </button>
        </div>
      ) : !data.onboardingComplete ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:clock" className="size-4 text-yellow-500" />
            <span className="text-sm text-yellow-500">{t("pending")}</span>
          </div>
          <button onClick={startOnboarding} disabled={loading} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            {t("resume")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:check-circle" className="size-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">{t("active")}</span>
          </div>
          {data.dashboardUrl && (
            <a href={data.dashboardUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              <Icon icon="lucide:external-link" className="size-3.5" /> {t("dashboard")}
            </a>
          )}
        </div>
      )}
    </div>

    {data?.onboardingComplete && (
      <div className="glass-card space-y-4 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Icon icon="lucide:receipt" className="size-5 text-palette-secondary-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t("paymentHistory")}</h2>
        </div>
        <PaymentHistory />
      </div>
    )}
  </>
  );
}
