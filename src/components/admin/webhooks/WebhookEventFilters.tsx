"use client";

import { useTranslations } from "next-intl";
import type { WebhookEventType, WebhookEventStatus } from "@/types/webhooks";

interface WebhookEventFiltersProps {
  eventType: WebhookEventType | "";
  status: WebhookEventStatus | "";
  onEventTypeChange: (value: WebhookEventType | "") => void;
  onStatusChange: (value: WebhookEventStatus | "") => void;
}

export function WebhookEventFilters({
  eventType,
  status,
  onEventTypeChange,
  onStatusChange,
}: WebhookEventFiltersProps) {
  const t = useTranslations("webhooks");

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={eventType}
        onChange={(e) => onEventTypeChange(e.target.value as WebhookEventType | "")}
        className="glass-input rounded-lg px-3 py-2 text-sm"
        aria-label={t("filters.eventType")}
      >
        <option value="">{t("filters.allEventTypes")}</option>
        <option value="create">{t("eventTypes.create")}</option>
        <option value="update">{t("eventTypes.update")}</option>
        <option value="delete">{t("eventTypes.delete")}</option>
      </select>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as WebhookEventStatus | "")}
        className="glass-input rounded-lg px-3 py-2 text-sm"
        aria-label={t("filters.status")}
      >
        <option value="">{t("filters.allStatuses")}</option>
        <option value="received">{t("statuses.received")}</option>
        <option value="processing">{t("statuses.processing")}</option>
        <option value="processed">{t("statuses.processed")}</option>
        <option value="failed">{t("statuses.failed")}</option>
        <option value="ignored">{t("statuses.ignored")}</option>
      </select>
    </div>
  );
}
