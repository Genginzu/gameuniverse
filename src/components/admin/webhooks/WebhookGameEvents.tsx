"use client";

import { useState } from "react";
import { useWebhookEvents } from "@/hooks/useWebhookEvents";
import { WebhookEventList } from "./WebhookEventList";
import { WebhookEventFilters } from "./WebhookEventFilters";
import { WebhookPagination } from "./WebhookPagination";
import type { WebhookEventType, WebhookEventStatus } from "@/types/webhooks";

export function WebhookGameEvents() {
  const [eventType, setEventType] = useState<WebhookEventType | "">("");
  const [status, setStatus] = useState<WebhookEventStatus | "">("");
  const [notImported, setNotImported] = useState(false);
  const [page, setPage] = useState(1);

  const { events, pagination, loading, refresh } = useWebhookEvents({
    entityType: "games",
    eventType: eventType || undefined,
    status: status || undefined,
    notImported: notImported || undefined,
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

  const handleNotImportedChange = (value: boolean) => {
    setNotImported(value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <WebhookEventFilters
        eventType={eventType}
        status={status}
        notImported={notImported}
        onEventTypeChange={handleEventTypeChange}
        onStatusChange={handleStatusChange}
        onNotImportedChange={handleNotImportedChange}
      />
      <WebhookEventList
        events={events}
        entityType="games"
        loading={loading}
        showImportAll={notImported}
        totalNotImported={notImported ? pagination.total : undefined}
        onRefresh={refresh}
      />
      <WebhookPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={setPage}
      />
    </div>
  );
}
