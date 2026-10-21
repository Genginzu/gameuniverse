"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import type { useAdminHomeShowcase } from "@/hooks/useAdminHomeShowcase";
import { SHOWCASE_LIMITS, type HomeShowcaseKind } from "@/types/home";
import { ShowcaseItemRow } from "./ShowcaseItemRow";
import { ShowcaseSearchPicker } from "./ShowcaseSearchPicker";

interface ShowcaseSectionProps {
  kind: HomeShowcaseKind;
  icon: string;
  showcase: ReturnType<typeof useAdminHomeShowcase>;
}

export function ShowcaseSection({ kind, icon, showcase }: ShowcaseSectionProps) {
  const t = useTranslations("admin.homeShowcase");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const items = showcase.itemsOf(kind);
  const limit = SHOWCASE_LIMITS[kind];
  const excludedIds = new Set(
    items.map((item) => item.entity?.id).filter((id): id is string => !!id)
  );

  const handle = async (action: Promise<string | null>) => setErrorCode(await action);

  return (
    <section className="glass-card space-y-4 rounded-2xl p-4 transition-all duration-300 md:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="from-cta-from to-cta-to flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-r">
            <Icon icon={icon} className="size-5 text-white" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t(`${kind}.title`)}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t(`${kind}.description`)}</p>
          </div>
        </div>
        <span className="shrink-0 font-mono text-sm text-gray-500 dark:text-gray-400">
          {t("count", { count: items.length, limit })}
        </span>
      </header>

      {items.length < limit ? (
        <ShowcaseSearchPicker
          kind={kind}
          excludedIds={excludedIds}
          disabled={showcase.pending}
          onSelect={(result) => handle(showcase.add(kind, result.id))}
          onImport={
            kind === "game" ? (result) => handle(showcase.importAndAdd(result.igdbId)) : undefined
          }
        />
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("limitReached")}</p>
      )}

      {errorCode && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {t(`errors.${errorCode}`)}
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-gray-400">
          {t(`${kind}.empty`)}
        </p>
      ) : (
        <ol className="space-y-2">
          {items.map((item, index) => (
            <ShowcaseItemRow
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              disabled={showcase.pending}
              onMove={(from, direction) => handle(showcase.move(kind, from, direction))}
              onRemove={(id) => handle(showcase.remove(id))}
              onStatusChange={(id, status) => handle(showcase.setStatus(id, status))}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
