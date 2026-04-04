"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Icon } from "@iconify/react";
import type { EntityType, EntityTranslationDetail } from "@/types/admin-translations";
import { TranslationEntityDetail } from "@/components/admin/translations/TranslationEntityDetail";

const VALID_TYPES = new Set([
  "games",
  "characters",
  "genres",
  "companies",
  "platforms",
  "character_roles",
  "genders",
  "species",
  "content_descriptors",
  "ratings",
]);

export default function TranslationEntityDetailPage() {
  const params = useParams();
  const entityType = params.entityType as string;
  const entityId = params.entityId as string;

  if (!VALID_TYPES.has(entityType)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Icon icon="mdi:alert-circle" className="mb-3 size-10 opacity-40" />
        <p>Invalid entity type</p>
      </div>
    );
  }

  return <DetailView entityType={entityType as EntityType} entityId={entityId} />;
}

function DetailView({ entityType, entityId }: { entityType: EntityType; entityId: string }) {
  const [translatingLangs, setTranslatingLangs] = useState<Set<string>>(new Set());
  const [savingLangs, setSavingLangs] = useState<Set<string>>(new Set());

  const swrKey = `/api/admin/translations/entity-detail?type=${entityType}&entityId=${entityId}`;
  const { data, isLoading, mutate } = useSWR<{ detail: EntityTranslationDetail }>(swrKey);
  const detail = data?.detail ?? null;

  /** Revalidate the detail view after translate/save */
  const revalidate = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const translateOne = useCallback(
    async (eid: string, targetLang: string) => {
      const res = await fetch("/api/admin/translations/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId: eid, targetLang, saveToDb: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Translation failed (${res.status})`);
      }
    },
    [entityType]
  );

  const handleTranslateLang = useCallback(
    async (lang: string) => {
      if (!detail) return;
      setTranslatingLangs((p) => new Set(p).add(lang));
      try {
        await translateOne(detail.entityId, lang);
        await revalidate();
      } catch {
        /* error handled by detail component */
      } finally {
        setTranslatingLangs((p) => {
          const n = new Set(p);
          n.delete(lang);
          return n;
        });
      }
    },
    [detail, translateOne, revalidate]
  );

  const handleTranslateAll = useCallback(async () => {
    if (!detail) return;
    const missing = detail.languages.filter((l) => l.status !== "complete").map((l) => l.language);
    if (!missing.length) return;
    setTranslatingLangs(new Set(missing));
    try {
      for (const lang of missing) await translateOne(detail.entityId, lang);
      await revalidate();
    } catch {
      /* error handled by detail component */
    } finally {
      setTranslatingLangs(new Set());
    }
  }, [detail, translateOne, revalidate]);

  const handleSaveLang = useCallback(
    async (lang: string, fields: Record<string, string>) => {
      setSavingLangs((p) => new Set(p).add(lang));
      try {
        const res = await fetch("/api/admin/translations/save", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityType, entityId, targetLang: lang, translations: fields }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Save failed (${res.status})`);
        }
        await revalidate();
      } finally {
        setSavingLangs((p) => {
          const n = new Set(p);
          n.delete(lang);
          return n;
        });
      }
    },
    [entityType, entityId, revalidate]
  );

  if (isLoading || !detail) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <div className="glass-card animate-pulse rounded-2xl p-6">
          <div className="mb-4 h-6 w-48 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-slate-700" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <TranslationEntityDetail
        detail={detail}
        entityType={entityType}
        isLoading={false}
        translatingLangs={translatingLangs}
        savingLangs={savingLangs}
        backHref={`/admin/translations/${entityType}`}
        onTranslateLang={handleTranslateLang}
        onTranslateAll={handleTranslateAll}
        onSaveLang={handleSaveLang}
      />
    </div>
  );
}
