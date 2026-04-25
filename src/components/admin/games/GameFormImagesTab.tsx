"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { GameFormTabProps } from "@/types/admin-games";
import { IgdbFieldIndicator } from "./IgdbFieldIndicator";
import { MediaListSection } from "./GameFormMediaListSection";

export function GameFormImagesTab({ form, t, isIgdbField }: GameFormTabProps) {
  const coverImageUrl = form.watch("cover_image_url");
  const backgroundImageUrl = form.watch("background_image_url");

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="cover_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("coverImage")}
                  {isIgdbField && (
                    <IgdbFieldIndicator
                      fieldName="cover_image"
                      isIgdbField={isIgdbField("cover_image")}
                    />
                  )}
                </FormLabel>
                <FormControl>
                  <Input type="url" placeholder={t("coverImagePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {coverImageUrl && (
            <div className="relative h-96 rounded-xl border border-gray-200 dark:border-gray-700">
              <Image
                src={coverImageUrl}
                alt="Cover preview"
                fill
                className="rounded-xl object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).parentElement!.style.display = "none";
                }}
              />
            </div>
          )}
        </div>
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="background_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("backgroundImage")}
                  {isIgdbField && (
                    <IgdbFieldIndicator
                      fieldName="background_image"
                      isIgdbField={isIgdbField("background_image")}
                    />
                  )}
                </FormLabel>
                <FormControl>
                  <Input type="url" placeholder={t("backgroundImagePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {backgroundImageUrl && (
            <div
              className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
              style={{ height: "360px" }}
            >
              <Image
                src={backgroundImageUrl}
                alt="Background preview"
                fill
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).parentElement!.style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </div>

      <MediaListSection
        form={form}
        t={t}
        isIgdbField={isIgdbField}
        fieldName="screenshots"
        trackableField="screenshots"
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

      <MediaListSection
        form={form}
        t={t}
        isIgdbField={isIgdbField}
        fieldName="artwork"
        trackableField="artworks"
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
