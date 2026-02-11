"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaPlus, FaTimes } from "react-icons/fa";
import type { CharacterFormTabProps } from "@/types/admin-characters";
import type { AdminCharacterMedia } from "@/lib/validations/admin-character-form";

const MEDIA_TYPES = ["screenshot", "artwork", "video"] as const;

export function CharacterFormMediaTab({ form, t }: CharacterFormTabProps) {
  const media = form.watch("media");

  const addMedia = (type: AdminCharacterMedia["type"]) => {
    const current = form.getValues("media");
    form.setValue("media", [
      ...current,
      {
        type,
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

  const removeMedia = (index: number) => {
    const current = form.getValues("media");
    form.setValue(
      "media",
      current.filter((_, i) => i !== index)
    );
  };

  const mediaTypeLabel = (type: string) => {
    try {
      return t(`mediaType_${type}`);
    } catch {
      return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {MEDIA_TYPES.map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => addMedia(type)}
          >
            <FaPlus className="h-3 w-3" />
            {mediaTypeLabel(type)}
          </Button>
        ))}
      </div>

      {media.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">{t("noMedia") ?? "Aucun média"}</p>
      ) : (
        <div className="space-y-3">
          {media.map((item, idx) => (
            <MediaItem
              key={idx}
              index={idx}
              form={form}
              t={t}
              mediaTypeLabel={mediaTypeLabel}
              onRemove={() => removeMedia(idx)}
            />
          ))}
        </div>
      )}

      {form.formState.errors.media && (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.media.message}
        </p>
      )}
    </div>
  );
}

/** Single media item row */
function MediaItem({
  index,
  form,
  t,
  mediaTypeLabel,
  onRemove,
}: CharacterFormTabProps & {
  index: number;
  mediaTypeLabel: (type: string) => string;
  onRemove: () => void;
}) {
  const type = form.watch(`media.${index}.type`);
  const url = form.watch(`media.${index}.url`);

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {mediaTypeLabel(type)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          aria-label={t("removeMedia") ?? "Supprimer"}
        >
          <FaTimes className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-start gap-4">
        {url && type !== "video" && (
          <img
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
            <Input
              placeholder={t("mediaTitle") ?? "Titre"}
              {...form.register(`media.${index}.title`)}
            />
            <Input
              placeholder={t("altText") ?? "Texte alternatif"}
              {...form.register(`media.${index}.alt_text`)}
            />
          </div>
          {type === "video" && (
            <Input
              type="url"
              placeholder={t("thumbnailUrl") ?? "URL de la miniature"}
              {...form.register(`media.${index}.thumbnail_url`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
