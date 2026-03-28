/**
 * SWR hook for managing IGDB webhook registrations.
 */

import useSWR from "swr";
import { useState } from "react";
import type { IGDBWebhookRegistration, WebhookEventType } from "@/types/webhooks";

interface RegistrationsResponse {
  webhooks: IGDBWebhookRegistration[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWebhookRegistrations() {
  const { data, error, isLoading, mutate } = useSWR<RegistrationsResponse>(
    "/api/admin/webhooks/registrations",
    fetcher
  );
  const [actionLoading, setActionLoading] = useState(false);

  async function registerWebhook(endpoint: string, method: WebhookEventType) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/webhooks/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, method }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Registration failed");
      }
      await mutate();
      return true;
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteWebhook(webhookId: number) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/webhooks/registrations/${webhookId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Deletion failed");
      }
      await mutate();
      return true;
    } finally {
      setActionLoading(false);
    }
  }

  return {
    webhooks: data?.webhooks ?? [],
    loading: isLoading,
    actionLoading,
    error,
    registerWebhook,
    deleteWebhook,
    refresh: mutate,
  };
}
