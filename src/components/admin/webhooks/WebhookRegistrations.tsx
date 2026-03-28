"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useWebhookRegistrations } from "@/hooks/useWebhookRegistrations";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { toast } from "@/hooks/use-toast";
import { IGDB_ENDPOINTS, type WebhookEventType } from "@/types/webhooks";

const METHOD_OPTIONS: WebhookEventType[] = ["create", "update", "delete"];

export function WebhookRegistrations() {
  const t = useTranslations("webhooks");
  const { webhooks, loading, actionLoading, registerWebhook, deleteWebhook } =
    useWebhookRegistrations();

  const [newEndpoint, setNewEndpoint] = useState<string>("games");
  const [newMethod, setNewMethod] = useState<WebhookEventType>("create");

  const handleRegister = async () => {
    try {
      await registerWebhook(newEndpoint, newMethod);
      toast({ title: t("registrations.registerSuccess"), variant: "success" });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : t("registrations.registerError"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (webhookId: number) => {
    try {
      await deleteWebhook(webhookId);
      toast({ title: t("registrations.deleteSuccess"), variant: "success" });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : t("registrations.deleteError"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Register new webhook */}
      <div className="rounded-xl border border-gray-200 bg-white/40 p-4 backdrop-blur-xl dark:border-gray-700 dark:bg-slate-800/50">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {t("registrations.registerNew")}
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
              {t("registrations.endpoint")}
            </label>
            <select
              value={newEndpoint}
              onChange={(e) => setNewEndpoint(e.target.value)}
              className="glass-input rounded-lg px-3 py-2 text-sm"
            >
              {IGDB_ENDPOINTS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
              {t("registrations.method")}
            </label>
            <select
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value as WebhookEventType)}
              className="glass-input rounded-lg px-3 py-2 text-sm"
            >
              {METHOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {t(`eventTypes.${m}`)}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleRegister} disabled={actionLoading} size="sm">
            <Icon icon="lucide:plus" className="mr-1 h-4 w-4" />
            {t("registrations.register")}
          </Button>
        </div>
      </div>

      {/* Active webhooks list */}
      <div className="rounded-xl border border-gray-200 bg-white/40 backdrop-blur-xl dark:border-gray-700 dark:bg-slate-800/50">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t("registrations.active")}
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Icon icon="lucide:loader-2" className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="p-8 text-center">
            <Icon icon="lucide:webhook" className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t("registrations.noWebhooks")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {webhooks.map((wh) => (
              <div key={wh.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {wh.url}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        wh.active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {wh.active
                        ? t("registrations.statusActive")
                        : t("registrations.statusInactive")}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">ID: {wh.id}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(wh.id)}
                  disabled={actionLoading}
                  className="text-red-500 hover:text-red-700"
                >
                  <Icon icon="lucide:trash-2" className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
