"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GameFormTabProps } from "@/types/admin-games";
import { IgdbFieldIndicator } from "./IgdbFieldIndicator";
import { Icon } from "@iconify/react";

/** Reusable sub-component for screenshots/artwork lists */
export function MediaListSection({
  form,
  t,
  isIgdbField,
  fieldName,
  trackableField,
  titleKey,
  fallbackTitle,
  addKey,
  emptyKey,
  fallbackEmpty,
  onAdd,
}: GameFormTabProps & {
  fieldName: "screenshots" | "artwork";
  trackableField: "screenshots" | "artworks";
  titleKey: string;
  fallbackTitle: string;
  addKey: string;
  emptyKey: string;
  fallbackEmpty: string;
  onAdd: () => void;
}) {
  const items = form.watch(fieldName);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t(titleKey) ?? fallbackTitle}{" "}
          {isIgdbField && <IgdbFieldIndicator fieldName={trackableField} isIgdbField={isIgdbField(trackableField)} />}{" "}
          <span className="font-normal text-gray-400">({items.length})</span>
        </h3>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onAdd}>
          <Icon icon="fa:plus" className="h-3 w-3" />
          {t(addKey) ?? "Ajouter"}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">{t(emptyKey) ?? fallbackEmpty}</p>
      ) : (
        <div className="space-y-3">
          {items.map((_, idx) => (
            <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20">
              <div className="flex items-start gap-4">
                {form.watch(`${fieldName}.${idx}.url`) && (
                  <div className="relative h-20 w-32 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Image src={form.watch(`${fieldName}.${idx}.url`)} alt={form.watch(`${fieldName}.${idx}.alt_text`) || ""} fill className="rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <Input type="url" placeholder="URL" {...form.register(`${fieldName}.${idx}.url`)} />
                  <Input placeholder={t("altText") ?? "Texte alternatif"} {...form.register(`${fieldName}.${idx}.alt_text`)} />
                </div>
                <button type="button" onClick={() => { const current = form.getValues(fieldName); form.setValue(fieldName, current.filter((_, i) => i !== idx)); }} className="mt-2 shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20" aria-label="Supprimer">
                  <Icon icon="fa:times" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
