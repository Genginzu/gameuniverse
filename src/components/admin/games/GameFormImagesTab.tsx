"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { FaPlus, FaTimes } from "react-icons/fa";
import type { GameFormTabProps } from "@/types/admin-games";

export function GameFormImagesTab({ form, t }: GameFormTabProps) {
  const coverImageUrl = form.watch("cover_image_url");
  const backgroundImageUrl = form.watch("background_image_url");

  return (
    <div className="space-y-8">
      {/* Cover & Background */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="cover_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("coverImage")}</FormLabel>
                <FormControl>
                  <Input type="url" placeholder={t("coverImagePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt="Cover preview"
              className="h-96 rounded-xl border border-gray-200 object-contain dark:border-gray-700"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
        </div>
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="background_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("backgroundImage")}</FormLabel>
                <FormControl>
                  <Input type="url" placeholder={t("backgroundImagePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {backgroundImageUrl && (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <img
                src={backgroundImageUrl}
                alt="Background preview"
                className="w-full object-contain"
                style={{ maxHeight: "360px" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).parentElement!.style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Screenshots */}
      <MediaListSection
        form={form}
        t={t}
        fieldName="screenshots"
        titleKey="screenshots"
        fallbackTitle="Captures d'écran"
        addKey="addScreenshot"
        emptyKey="noScreenshots"
        fallbackEmpty="Aucune capture d'écran"
        onAdd={() => {
          const current = form.getValues("screenshots");
          form.setValue("screenshots", [
            ...current,
            {
              url: "",
              alt_text: "",
              caption: "",
              display_order: current.length,
              is_featured: false,
            },
          ]);
        }}
      />

      {/* Artwork */}
      <MediaListSection
        form={form}
        t={t}
        fieldName="artwork"
        titleKey="artwork"
        fallbackTitle="Illustrations"
        addKey="addArtwork"
        emptyKey="noArtwork"
        fallbackEmpty="Aucune illustration"
        onAdd={() => {
          const current = form.getValues("artwork");
          form.setValue("artwork", [
            ...current,
            {
              url: "",
              alt_text: "",
              caption: "",
              artwork_type: "",
              display_order: current.length,
              is_featured: false,
            },
          ]);
        }}
      />
    </div>
  );
}

/** Sous-composant réutilisable pour les listes screenshots/artwork */
function MediaListSection({
  form,
  t,
  fieldName,
  titleKey,
  fallbackTitle,
  addKey,
  emptyKey,
  fallbackEmpty,
  onAdd,
}: GameFormTabProps & {
  fieldName: "screenshots" | "artwork";
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
          <span className="font-normal text-gray-400">({items.length})</span>
        </h3>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onAdd}>
          <FaPlus className="h-3 w-3" />
          {t(addKey) ?? "Ajouter"}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">{t(emptyKey) ?? fallbackEmpty}</p>
      ) : (
        <div className="space-y-3">
          {items.map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20"
            >
              <div className="flex items-start gap-4">
                {form.watch(`${fieldName}.${idx}.url`) && (
                  <img
                    src={form.watch(`${fieldName}.${idx}.url`)}
                    alt={form.watch(`${fieldName}.${idx}.alt_text`) || ""}
                    className="h-20 w-32 flex-shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    type="url"
                    placeholder="URL"
                    {...form.register(`${fieldName}.${idx}.url`)}
                  />
                  <Input
                    placeholder={t("altText") ?? "Texte alternatif"}
                    {...form.register(`${fieldName}.${idx}.alt_text`)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const current = form.getValues(fieldName);
                    form.setValue(
                      fieldName,
                      current.filter((_, i) => i !== idx)
                    );
                  }}
                  className="mt-2 flex-shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  aria-label="Supprimer"
                >
                  <FaTimes className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
