/**
 * SWR hook for fetching IGDB webhook events with pagination and filters.
 */

import useSWR from "swr";
import type {
  WebhookEventWithDetails,
  WebhookEventType,
  WebhookEventStatus,
} from "@/types/webhooks";

interface WebhookEventsFilters {
  entityType?: string;
  eventType?: WebhookEventType;
  status?: WebhookEventStatus;
  page?: number;
  limit?: number;
}

interface WebhookEventsResponse {
  events: WebhookEventWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function buildUrl(filters: WebhookEventsFilters): string {
  const params = new URLSearchParams();
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.eventType) params.set("eventType", filters.eventType);
  if (filters.status) params.set("status", filters.status);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  return `/api/admin/webhooks/events?${params.toString()}`;
}

export function useWebhookEvents(filters: WebhookEventsFilters = {}) {
  const url = buildUrl(filters);
  const { data, error, isLoading, mutate } = useSWR<WebhookEventsResponse>(url, fetcher, {
    refreshInterval: 30000, // Auto-refresh every 30s for near-realtime updates
  });

  return {
    events: data?.events ?? [],
    pagination: data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
    loading: isLoading,
    error,
    refresh: mutate,
  };
}
