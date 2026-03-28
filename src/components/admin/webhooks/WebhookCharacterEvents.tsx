"use client";

import { useState } from "react";
import { useWebhookEvents } from "@/hooks/useWebhookEvents";
import { WebhookEventList } from "./WebhookEventList";
import { WebhookEventFilters } from "./WebhookEventFilters";
import { WebhookPagination } from "./WebhookPagination";
import type { WebhookEventType, WebhookEventStatus } from "@/types/webhooks";

export function WebhookCharacterEvents() {
  const [eventType, setEventType] = useState<WebhookEventType | "">("");
  const [status, setStatus] = useState<WebhookEventStatus | "">("");
  const [page, setPage] = useState(1);

  const { events, pagination, loading } = useWebhookEvents({
    entityType: "characters",
    eventType: eventType || undefined,
    status: status || undefined,
    page,
  });

  const handleEventTypeChange = (value: WebhookEventType | "") => {
    setEventType(value);
    setPage(1);
  };

  const handleStatusChange = (value: WebhookEventStatus | "") => {
    setStatus(value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <WebhookEventFilters
        eventType={eventType}
        status={status}
        onEventTypeChange={handleEventTypeChange}
        onStatusChange={handleStatusChange}
      />
      <WebhookEventList events={events} entityType="characters" loading={loading} />
      <WebhookPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={setPage}
      />
    </div>
  );
}
