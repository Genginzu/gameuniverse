"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaPlus, FaTimes } from "react-icons/fa";
import type { UseFormReturn } from "react-hook-form";
import type {
  AdminCharacterFormData,
  AdminCharacterMedia,
} from "@/lib/validations/admin-character-form";

interface CharacterMediaListSectionProps {
  form: UseFormReturn<AdminCharacterFormData>;
  t: (key: string) => string;
  mediaType: AdminCharacterMedia["type"];
  titleKey: string;
  addKey: string;
  emptyKey: string;
  /** Show thumbnail_url field (for videos) */
  showThumbnail?: boolean;
}

/** Sous-composant réutilisable pour les listes de médias par type */
export function CharacterMediaListSection({
  form,
  t,
  mediaType,
  titleKey,
  addKey,
  emptyKey,
  showThumbnail = false,
}: CharacterMediaListSectionProps) {
  const allMedia = form.watch("media");
  const indices = allMedia.reduce<number[]>((acc, m, i) => {
    if (m.type === mediaType) acc.push(i);
    return acc;
  }, []);

  const addItem = () => {
    const current = form.getValues("media");
    form.setValue("media", [
      ...current,
      {
        type: mediaType,
        url: "",
        thumbnail_url: "",
        title: "",
        description: "",
        alt_text: "",
        is_featured: false,
        display_order: current.length,
      },
    ]);
  };

  const removeItem = (globalIndex: number) => {
    const current = form.getValues("media");
    form.setValue(
      "media",
      current.filter((_, i) => i !== globalIndex)
    );
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t(titleKey)} <span className="font-normal text-gray-400">({indices.length})</span>
        </h3>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
          <FaPlus className="h-3 w-3" />
          {t(addKey)}
        </Button>
      </div>

      {indices.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">{t(emptyKey)}</p>
      ) : (
        <div className="space-y-3">
          {indices.map((globalIdx) => (
            <MediaItemCard
              key={globalIdx}
              index={globalIdx}
              form={form}
              t={t}
              showThumbnail={showThumbnail}
              onRemove={() => removeItem(globalIdx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Carte individuelle d'un média */
function MediaItemCard({
  index,
  form,
  t,
  showThumbnail,
  onRemove,
}: {
  index: number;
  form: UseFormReturn<AdminCharacterFormData>;
  t: (key: string) => string;
  showThumbnail: boolean;
  onRemove: () => void;
}) {
  const url = form.watch(`media.${index}.url`);

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20">
      <div className="flex items-start gap-4">
        {url && !showThumbnail && (
          <img
            key={url}
            src={url}
            alt={form.watch(`media.${index}.alt_text`) || ""}
            className="h-20 w-32 flex-shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <Input type="url" placeholder="URL" {...form.register(`media.${index}.url`)} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder={t("mediaTitle")} {...form.register(`media.${index}.title`)} />
            <Input placeholder={t("altText")} {...form.register(`media.${index}.alt_text`)} />
          </div>
          {showThumbnail && (
            <Input
              type="url"
              placeholder={t("thumbnailUrl")}
              {...form.register(`media.${index}.thumbnail_url`)}
            />
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 flex-shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          aria-label={t("removeMedia")}
        >
          <FaTimes className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
