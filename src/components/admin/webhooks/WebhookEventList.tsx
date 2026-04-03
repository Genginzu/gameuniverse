"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import type { WebhookEventWithDetails } from "@/types/webhooks";

interface WebhookEventListProps {
  events: WebhookEventWithDetails[];
  entityType: "games" | "characters";
  loading: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  received: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  ignored: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const EVENT_ICONS: Record<string, string> = {
  create: "lucide:plus-circle",
  update: "lucide:refresh-cw",
  delete: "lucide:trash-2",
};

export function WebhookEventList({ events, entityType, loading }: WebhookEventListProps) {
  const t = useTranslations("webhooks");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon icon="lucide:loader-2" className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white/40 p-8 text-center backdrop-blur-xl dark:border-gray-700 dark:bg-slate-800/50">
        <Icon icon="lucide:inbox" className="mx-auto h-10 w-10 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t("noEvents")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white/40 backdrop-blur-xl dark:border-gray-700 dark:bg-slate-800/50">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
              {t("columns.event")}
            </th>
            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
              {t("columns.entity")}
            </th>
            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
              {t("columns.igdbId")}
            </th>
            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
              {t("columns.status")}
            </th>
            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
              {t("columns.date")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {events.map((event) => (
            <EventRow key={event.id} event={event} entityType={entityType} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventRow({
  event,
  entityType,
}: {
  event: WebhookEventWithDetails;
  entityType: "games" | "characters";
}) {
  const t = useTranslations("webhooks");

  const entityName = entityType === "games" ? event.game_name : event.character_name;
  const entitySlug = entityType === "games" ? event.game_slug : event.character_slug;
  const entityLink =
    entityType === "games" && entitySlug
      ? `/admin/games/${event.game_id}`
      : entityType === "characters" && entitySlug
        ? `/admin/characters/${event.character_id}`
        : null;

  const canViewDiff = event.event_type === "update" && entityType === "games" && event.game_id;
  const diffLink = canViewDiff ? `/admin/webhooks/events/${event.id}` : null;

  const isCreateSuccess =
    event.event_type === "create" && event.status === "processed" && event.game_id;

  const date = new Date(event.created_at);
  const formattedDate = date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <tr className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon
            icon={EVENT_ICONS[event.event_type] ?? "lucide:circle"}
            className="h-4 w-4 text-gray-500"
          />
          <span className="font-medium text-gray-900 dark:text-white">
            {t(`eventTypes.${event.event_type}`)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        {entityLink ? (
          <Link href={entityLink} className="text-cyan-600 hover:underline dark:text-cyan-400">
            {entityName ?? t("unknownEntity")}
          </Link>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">
            {entityName ?? t("unknownEntity")}
          </span>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
        {event.igdb_id}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[event.status] ?? ""}`}
        >
          {t(`statuses.${event.status}`)}
        </span>
        {isCreateSuccess && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <Icon icon="lucide:check-circle" className="h-3 w-3" />
            {t("importSuccess")}
          </span>
        )}
        {event.error_message && (
          <p className="mt-1 max-w-xs truncate text-xs text-red-500" title={event.error_message}>
            {event.error_message}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span>{formattedDate}</span>
          {isCreateSuccess && entityLink && (
            <Link
              href={entityLink}
              className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
            >
              <Icon icon="lucide:external-link" className="h-3 w-3" />
              {t("viewGame")}
            </Link>
          )}
          {diffLink && (
            <Link
              href={diffLink}
              className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700 transition-colors hover:bg-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400 dark:hover:bg-cyan-900/40"
            >
              <Icon icon="lucide:git-compare" className="h-3 w-3" />
              {t("viewDiff")}
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}
