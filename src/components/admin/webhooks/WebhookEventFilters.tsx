"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { WebhookEventType, WebhookEventStatus } from "@/types/webhooks";

type EventFilter = WebhookEventType | "notImported" | "";

interface WebhookEventFiltersProps {
  eventType: WebhookEventType | "";
  status: WebhookEventStatus | "";
  notImported: boolean;
  onEventTypeChange: (value: WebhookEventType | "") => void;
  onStatusChange: (value: WebhookEventStatus | "") => void;
  onNotImportedChange: (value: boolean) => void;
}

const EVENT_BUTTONS: {
  value: EventFilter;
  icon: string;
  labelKey: string;
  color: string;
  activeColor: string;
}[] = [
  {
    value: "",
    icon: "lucide:list",
    labelKey: "filters.allEventTypes",
    color: "text-gray-600 dark:text-gray-400",
    activeColor: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white",
  },
  {
    value: "create",
    icon: "lucide:plus-circle",
    labelKey: "eventTypes.create",
    color: "text-green-600 dark:text-green-400",
    activeColor: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  },
  {
    value: "update",
    icon: "lucide:refresh-cw",
    labelKey: "eventTypes.update",
    color: "text-yellow-600 dark:text-yellow-400",
    activeColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  },
  {
    value: "delete",
    icon: "lucide:trash-2",
    labelKey: "eventTypes.delete",
    color: "text-red-600 dark:text-red-400",
    activeColor: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
  {
    value: "notImported",
    icon: "lucide:download",
    labelKey: "filters.notImported",
    color: "text-palette-primary-600 dark:text-palette-primary-400",
    activeColor:
      "bg-palette-primary-100 text-palette-primary-800 dark:bg-palette-primary-900/40 dark:text-palette-primary-300",
  },
];

export function WebhookEventFilters({
  eventType,
  status,
  notImported,
  onEventTypeChange,
  onStatusChange,
  onNotImportedChange,
}: WebhookEventFiltersProps) {
  const t = useTranslations("webhooks");

  const activeFilter: EventFilter = notImported ? "notImported" : eventType;

  const handleClick = (value: EventFilter) => {
    if (value === "notImported") {
      onNotImportedChange(true);
      onEventTypeChange("");
    } else {
      onNotImportedChange(false);
      onEventTypeChange(value as WebhookEventType | "");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Event type buttons */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-white/40 p-1 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/40">
        {EVENT_BUTTONS.map((btn) => {
          const isActive = activeFilter === btn.value;
          return (
            <button
              key={btn.value || "all"}
              type="button"
              onClick={() => handleClick(btn.value)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? btn.activeColor
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50"
              }`}
            >
              <Icon icon={btn.icon} className={`h-3.5 w-3.5 ${isActive ? "" : btn.color}`} />
              {t(btn.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Status select */}
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
