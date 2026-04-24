"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { CharacterFormTabProps } from "@/types/admin-characters";
import type { AvailableGame } from "@/hooks/useCharacterForm";
import { useCharacterImageSearch } from "@/hooks/useCharacterImageSearch";

interface CharacterFormImagesTabProps extends CharacterFormTabProps {
  availableGames?: AvailableGame[];
}

export function CharacterFormImagesTab({ form, t, availableGames = [] }: CharacterFormImagesTabProps) {
  const mainImageUrl = form.watch("main_image_url");
  const backgroundImageUrl = form.watch("background_image_url");
  const mainSearch = useCharacterImageSearch(form, "main_image_url", availableGames);
  const bgSearch = useCharacterImageSearch(form, "background_image_url", availableGames);

  const mainSearch = useImageSearch(form, "main_image_url", availableGames);
  const bgSearch = useImageSearch(form, "background_image_url", availableGames);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <ImageField form={form} name="main_image_url" label={t("mainImage")} placeholder={t("mainImagePlaceholder")} imageUrl={mainImageUrl} search={mainSearch} t={t} imageHeight="h-96" />
        <ImageField form={form} name="background_image_url" label={t("backgroundImage")} placeholder={t("backgroundImagePlaceholder")} imageUrl={backgroundImageUrl} search={bgSearch} t={t} imageHeight="h-[360px]" />
      </div>
    </div>
  );
}

function ImageField({
  form, name, label, placeholder, imageUrl, search, t, imageHeight,
}: {
  form: CharacterFormTabProps["form"];
  name: "main_image_url" | "background_image_url";
  label: string;
  placeholder: string;
  imageUrl: string | null | undefined;
  search: ReturnType<typeof useCharacterImageSearch>;
  t: (key: string) => string;
  imageHeight: string;
}) {
  return (
    <div className="space-y-3">
      <FormField control={form.control} name={name} render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex gap-2">
            <FormControl><Input type="url" placeholder={placeholder} {...field} value={field.value ?? ""} /></FormControl>
            <Button type="button" variant="outline" size="icon" onClick={search.search} disabled={search.loading} title={t("searchImage")} className="shrink-0">
              {search.loading ? <Icon icon="mdi:loading" className="size-4 animate-spin" /> : <Icon icon="mdi:image-search" className="size-4" />}
            </Button>
          </div>
          <FormMessage />
          {search.error && <p className="text-sm text-red-500">{t(search.error)}</p>}
          {search.source && <p className="text-muted-foreground text-xs">{t("imageSource")}: {search.source}</p>}
        </FormItem>
      )} />
      {imageUrl && (
        <div className={`relative ${imageHeight} rounded-xl border border-gray-200 dark:border-gray-700`}>
          <Image key={imageUrl} src={imageUrl} alt={`${label} preview`} fill className="rounded-xl object-contain" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} />
        </div>
      )}
    </div>
  );
}
