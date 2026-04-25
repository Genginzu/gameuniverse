"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { toast } from "@/hooks/use-toast";
import type { WebhookEventWithDetails } from "@/types/webhooks";
import { WebhookEventRow } from "./WebhookEventRow";
import { WebhookImportAllBar } from "./WebhookImportAllBar";

interface WebhookEventListProps {
  events: WebhookEventWithDetails[];
  entityType: "games" | "characters";
  loading: boolean;
  showImportAll?: boolean;
  totalNotImported?: number;
  onRefresh?: () => void;
}

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
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDelete = useCallback(
    async (gameId: string) => {
      if (typeof window !== "undefined" && !window.confirm(t("deleteConfirm"))) return;
      setDeletingIds((prev) => new Set(prev).add(gameId));
      toast({ title: t("deleteStarted") });
      try {
        const res = await fetch(`/api/admin/games/${gameId}`, { method: "DELETE" });
        if (res.ok) {
          toast({ title: t("deleteDone"), variant: "success" });
          onRefresh?.();
        } else {
          const body = await res.json().catch(() => ({}));
          toast({ title: t("deleteFailed"), description: body.error, variant: "destructive" });
        }
      } catch {
        toast({ title: t("deleteFailed"), variant: "destructive" });
      } finally {
        setDeletingIds((prev) => { const next = new Set(prev); next.delete(gameId); return next; });
      }
    },
    [t, onRefresh]
  );

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
          toast({ title: t("importFailed", { id: igdbId }), description: body.error, variant: "destructive" });
        }
      } catch {
        toast({ title: t("importFailed", { id: igdbId }), variant: "destructive" });
      } finally {
        setImportingIds((prev) => { const next = new Set(prev); next.delete(igdbId); return next; });
      }
    },
    [t, onRefresh]
  );

  const handleImportAll = useCallback(async () => {
    setImportingAll(true);
    try {
      const res = await fetch(`/api/admin/webhooks/events/not-imported-ids?limit=${importCount}`);
      if (!res.ok) {
        toast({ title: t("importFailed", { id: 0 }), variant: "destructive" });
        setImportingAll(false);
        return;
      }
      const { igdbIds } = (await res.json()) as { igdbIds: number[] };
      if (igdbIds.length === 0) { setImportingAll(false); return; }
      toast({ title: t("importAllStarted", { count: igdbIds.length }) });
      const promises: Promise<void>[] = [];
      for (let i = 0; i < igdbIds.length; i++) {
        const igdbId = igdbIds[i];
        const delay = i * 1000;
        promises.push(new Promise<void>((resolve) => { setTimeout(async () => { await handleImport(igdbId); resolve(); }, delay); }));
      }
      await Promise.all(promises);
      toast({ title: t("importAllDone", { count: igdbIds.length }), variant: "success" });
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
        <WebhookImportAllBar
          totalNotImported={totalNotImported ?? 0}
          importCount={importCount}
          onImportCountChange={setImportCount}
          importingAll={importingAll}
          importingAny={importingIds.size > 0}
          onImportAll={handleImportAll}
          t={(key) => t(key, { count: totalNotImported ?? 0 })}
        />
      )}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white/40 backdrop-blur-xl dark:border-gray-700 dark:bg-slate-800/50">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t("columns.event")}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t("columns.entity")}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t("columns.igdbId")}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t("columns.status")}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t("columns.date")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {events.map((event) => (
              <WebhookEventRow
                key={event.id}
                event={event}
                entityType={entityType}
                onImportStarted={handleImport}
                importingIgdbIds={importingIds}
                onDeleteGame={handleDelete}
                deletingGameIds={deletingIds}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
