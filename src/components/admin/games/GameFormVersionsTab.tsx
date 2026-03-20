"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import type { GameFormTabProps } from "@/types/admin-games";
import { IgdbFieldIndicator } from "./IgdbFieldIndicator";
import { Icon } from "@iconify/react";

export function GameFormVersionsTab({ form, t, isIgdbField }: GameFormTabProps) {
  const watchedVersions = form.watch("versions");

  const addVersion = () => {
    const current = form.getValues("versions");
    form.setValue("versions", [
      ...current,
      { version_title: "", description: "", cover_image_url: "", display_order: current.length },
    ]);
  };

  const removeVersion = (idx: number) => {
    const current = form.getValues("versions");
    form.setValue(
      "versions",
      current.filter((_, i) => i !== idx),
      { shouldValidate: true }
    );
  };

  return (
    <div className="space-y-4">
      {isIgdbField && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <IgdbFieldIndicator fieldName="versions" isIgdbField={isIgdbField("versions")} />
        </div>
      )}
      {watchedVersions.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("noVersions") ?? "Aucune version"}
        </p>
      ) : (
        <div className="space-y-3">
          {watchedVersions.map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20"
            >
              <div className="flex items-start gap-4">
                {form.watch(`versions.${idx}.cover_image_url`) && (
                  <div className="relative h-24 w-16 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Image
                      src={form.watch(`versions.${idx}.cover_image_url`) || ""}
                      alt=""
                      fill
                      className="rounded-lg object-cover"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).parentElement!.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    placeholder={t("versionTitle") ?? "Nom de la version (ex: Deluxe Edition)"}
                    {...form.register(`versions.${idx}.version_title`)}
                  />
                  <Input
                    type="url"
                    placeholder={t("versionCoverUrl") ?? "URL de l'image de couverture"}
                    {...form.register(`versions.${idx}.cover_image_url`)}
                  />
                  <Textarea
                    placeholder={t("versionDescription") ?? "Description de la version..."}
                    rows={2}
                    {...form.register(`versions.${idx}.description`)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVersion(idx)}
                  className="mt-2 shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  aria-label="Supprimer"
                >
                  <Icon icon="fa:times" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addVersion} className="gap-1.5">
        <Icon icon="fa:plus" className="h-3 w-3" />
        {t("addVersion") ?? "Ajouter une version"}
      </Button>

      {form.formState.errors.versions && (
        <p className="text-destructive text-sm font-medium">
          {form.formState.errors.versions.message}
        </p>
      )}
    </div>
  );
}
