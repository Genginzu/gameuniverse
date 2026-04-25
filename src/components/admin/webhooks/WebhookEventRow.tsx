"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import type { WebhookEventWithDetails } from "@/types/webhooks";

const EVENT_ICONS: Record<string, string> = {
  create: "lucide:plus-circle",
  update: "lucide:refresh-cw",
  delete: "lucide:trash-2",
};

const EVENT_COLORS: Record<string, string> = {
  create: "text-green-600 dark:text-green-400",
  update: "text-yellow-600 dark:text-yellow-400",
  delete: "text-red-600 dark:text-red-400",
};

const STATUS_STYLES: Record<string, string> = {
  received: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  ignored: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

interface WebhookEventRowProps {
  event: WebhookEventWithDetails;
  entityType: "games" | "characters";
  onImportStarted?: (igdbId: number) => void;
  importingIgdbIds?: Set<number>;
  onDeleteGame?: (gameId: string) => void;
  deletingGameIds?: Set<string>;
}

export function WebhookEventRow({
  event,
  entityType,
  onImportStarted,
  importingIgdbIds,
  onDeleteGame,
  deletingGameIds,
}: WebhookEventRowProps) {
  const t = useTranslations("webhooks");

  const hasLocalEntity =
    entityType === "games" ? Boolean(event.game_id) : Boolean(event.character_id);
  const rawName = entityType === "games" ? event.game_name : event.character_name;
  const entityName = hasLocalEntity ? rawName : null;
  const entitySlug = entityType === "games" ? event.game_slug : event.character_slug;
  const entityLink =
    entityType === "games" && entitySlug && event.game_id
      ? `/admin/games/${event.game_id}/edit`
      : entityType === "characters" && entitySlug && event.character_id
        ? `/admin/characters/${event.character_id}/edit`
        : null;

  const diffLink =
    event.event_type === "update" && entityType === "games" && event.game_id
      ? `/admin/webhooks/events/${event.id}`
      : null;

  const canImport =
    entityType === "games" && !event.game_id && event.igdb_id && event.event_type !== "delete";
  const isImporting = importingIgdbIds?.has(event.igdb_id) ?? false;
  const canDelete =
    entityType === "games" && event.event_type === "delete" && Boolean(event.game_id);
  const isDeleting = event.game_id ? (deletingGameIds?.has(event.game_id) ?? false) : false;
  const isCreateSuccess =
    event.event_type === "create" && event.status === "processed" && event.game_id;

  const formattedDate = new Date(event.created_at).toLocaleDateString("fr-FR", {
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
            className={`h-4 w-4 ${EVENT_COLORS[event.event_type] ?? "text-gray-500"}`}
          />
          <span
            className={`font-medium ${EVENT_COLORS[event.event_type] ?? "text-gray-900 dark:text-white"}`}
          >
            {t(`eventTypes.${event.event_type}`)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        {entityLink ? (
          <Link
            href={entityLink}
            className="text-palette-secondary-600 dark:text-palette-secondary-400 hover:underline"
          >
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
              className="bg-palette-secondary-50 text-palette-secondary-700 hover:bg-palette-secondary-100 dark:bg-palette-secondary-900/20 dark:text-palette-secondary-400 dark:hover:bg-palette-secondary-900/40 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
            >
              <Icon icon="lucide:git-compare" className="h-3 w-3" />
              {t("viewDiff")}
            </Link>
          )}
          {canImport && (
            <button
              type="button"
              disabled={isImporting}
              onClick={() => onImportStarted?.(event.igdb_id)}
              className="bg-palette-primary-50 text-palette-primary-700 hover:bg-palette-primary-100 dark:bg-palette-primary-900/20 dark:text-palette-primary-400 dark:hover:bg-palette-primary-900/40 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isImporting ? (
                <Icon icon="lucide:loader-2" className="h-3 w-3 animate-spin" />
              ) : (
                <Icon icon="lucide:download" className="h-3 w-3" />
              )}
              {isImporting ? t("importing") : t("importGame")}
            </button>
          )}
          {canDelete && event.game_id && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => onDeleteGame?.(event.game_id!)}
              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              {isDeleting ? (
                <Icon icon="lucide:loader-2" className="h-3 w-3 animate-spin" />
              ) : (
                <Icon icon="lucide:trash-2" className="h-3 w-3" />
              )}
              {isDeleting ? t("deleting") : t("deleteGame")}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
