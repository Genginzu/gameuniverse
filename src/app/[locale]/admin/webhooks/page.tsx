"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { WebhookGameEvents } from "@/components/admin/webhooks/WebhookGameEvents";
import { WebhookCharacterEvents } from "@/components/admin/webhooks/WebhookCharacterEvents";
import { WebhookRegistrations } from "@/components/admin/webhooks/WebhookRegistrations";

type Tab = "games" | "characters" | "registrations";

export default function AdminWebhooksPage() {
  const t = useTranslations("webhooks");
  const [activeTab, setActiveTab] = useState<Tab>("games");

  const tabs: { key: Tab; label: string }[] = [
    { key: "games", label: t("tabs.games") },
    { key: "characters", label: t("tabs.characters") },
    { key: "registrations", label: t("tabs.registrations") },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "games" && <WebhookGameEvents />}
      {activeTab === "characters" && <WebhookCharacterEvents />}
      {activeTab === "registrations" && <WebhookRegistrations />}
    </div>
  );
}
