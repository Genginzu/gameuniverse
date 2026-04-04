"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { toast } from "@/hooks/use-toast";
import type { WebhookEventWithDetails } from "@/types/webhooks";

interface WebhookEventListProps {
  events: WebhookEventWithDetails[];
  entityType: "games" | "characters";
  loading: boolean;
  /** Show the "Import all" button (when notImported filter is active) */
  showImportAll?: boolean;
  /** Total number of not-imported events (from pagination) */
  totalNotImported?: number;
  /** Called after a successful import to refresh the event list */
  onRefresh?: () => void;
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

const EVENT_COLORS: Record<string, string> = {
  create: "text-green-600 dark:text-green-400",
  update: "text-yellow-600 dark:text-yellow-400",
  delete: "text-red-600 dark:text-red-400",
};

export function WebhookEventList({
  events,
  entityType,
  loading,
  showImportAll,
  totalNotImported,
  onRefresh,
}: WebhookEventListProps) {
  const t = useTranslations("webhooks");
  const [importingIds, setImportingIds] = useState<Set<number>>(new Set());
  const [importingAll, setImportingAll] = useState(false);
  const [importCount, setImportCount] = useState(20);

  const handleImport = useCallback(
    async (igdbId: number) => {
      setImportingIds((prev) => new Set(prev).add(igdbId));
      toast({ title: t("importStarted", { id: igdbId }) });

      try {
        const res = await fetch("/api/games/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ igdbId }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          // Link webhook events to the newly imported game
          if (data.game?.id) {
            await fetch(`/api/admin/webhooks/events/link`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ igdbId, gameId: data.game.id }),
            }).catch(() => {});
          }
          toast({ title: t("importDone", { id: igdbId }), variant: "success" });
          onRefresh?.();
        } else {
          const body = await res.json().catch(() => ({}));
          toast({
            title: t("importFailed", { id: igdbId }),
            description: body.error,
            variant: "destructive",
          });
        }
      } catch {
        toast({ title: t("importFailed", { id: igdbId }), variant: "destructive" });
      } finally {
        setImportingIds((prev) => {
          const next = new Set(prev);
          next.delete(igdbId);
          return next;
        });
      }
    },
    [t, onRefresh]
  );

  const handleImportAll = useCallback(async () => {
    setImportingAll(true);

    try {
      // Fetch the igdb_ids to import from the API
      const res = await fetch(`/api/admin/webhooks/events/not-imported-ids?limit=${importCount}`);
      if (!res.ok) {
        toast({ title: t("importFailed", { id: 0 }), variant: "destructive" });
        setImportingAll(false);
        return;
      }
      const { igdbIds } = (await res.json()) as { igdbIds: number[] };
      if (igdbIds.length === 0) {
        setImportingAll(false);
        return;
      }

      toast({ title: t("importAllStarted", { count: igdbIds.length }) });

      // Fire one import per second
      const promises: Promise<void>[] = [];
      for (let i = 0; i < igdbIds.length; i++) {
        const igdbId = igdbIds[i];
        const delay = i * 1000;
        promises.push(
          new Promise<void>((resolve) => {
            setTimeout(async () => {
              await handleImport(igdbId);
              resolve();
            }, delay);
          })
        );
      }

      await Promise.all(promises);

      toast({
        title: t("importAllDone", { count: igdbIds.length }),
        variant: "success",
      });
      onRefresh?.();
    } catch {
      toast({ title: t("importFailed", { id: 0 }), variant: "destructive" });
    } finally {
      setImportingAll(false);
    }
  }, [importCount, handleImport, t, onRefresh]);

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
    <div className="space-y-3">
      {showImportAll && (totalNotImported ?? 0) > 0 && (
        <div className="flex items-center justify-between rounded-xl border-2 border-violet-300 bg-violet-50 px-4 py-3 dark:border-violet-700 dark:bg-violet-900/20">
          <span className="text-sm font-medium text-violet-800 dark:text-violet-300">
            {t("importAllHint", { count: totalNotImported ?? 0 })}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <select
              value={importCount}
              onChange={(e) => setImportCount(Number(e.target.value))}
              disabled={importingAll}
              className="rounded-md border border-violet-300 bg-white px-2 py-1.5 text-sm text-violet-800 dark:border-violet-600 dark:bg-violet-900/40 dark:text-violet-200"
            >
              {[20, 40, 60, 80, 100, 200, 300, 400].map((n) => (
                <option key={n} value={n}>
                  {n} {t("importCountLabel")}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={importingAll || importingIds.size > 0}
              onClick={handleImportAll}
              className="shrink-0 rounded-lg bg-linear-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {importingAll ? t("importingAll") : t("importAll")}
            </button>
          </div>
        </div>
      )}
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
              <EventRow
                key={event.id}
                event={event}
                entityType={entityType}
                onImportStarted={handleImport}
                importingIgdbIds={importingIds}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventRow({
  event,
  entityType,
  onImportStarted,
  importingIgdbIds,
}: {
  event: WebhookEventWithDetails;
  entityType: "games" | "characters";
  onImportStarted?: (igdbId: number) => void;
  importingIgdbIds?: Set<number>;
}) {
  const t = useTranslations("webhooks");

  const entityName = entityType === "games" ? event.game_name : event.character_name;
  const entitySlug = entityType === "games" ? event.game_slug : event.character_slug;
  const entityLink =
    entityType === "games" && entitySlug
      ? `/admin/games/${event.game_id}/edit`
      : entityType === "characters" && entitySlug
        ? `/admin/characters/${event.character_id}/edit`
        : null;

  const canViewDiff = event.event_type === "update" && entityType === "games" && event.game_id;
  const diffLink = canViewDiff ? `/admin/webhooks/events/${event.id}` : null;

  // Show import button when game is not in local DB
  const canImport = entityType === "games" && !event.game_id && event.igdb_id;
  const isImporting = importingIgdbIds?.has(event.igdb_id) ?? false;

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
          {canImport && (
            <button
              type="button"
              disabled={isImporting}
              onClick={() => onImportStarted?.(event.igdb_id)}
              className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:bg-violet-900/40"
            >
              {isImporting ? (
                <Icon icon="lucide:loader-2" className="h-3 w-3 animate-spin" />
              ) : (
                <Icon icon="lucide:download" className="h-3 w-3" />
              )}
              {isImporting ? t("importing") : t("importGame")}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
