"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { CharacterFormTabProps } from "@/types/admin-characters";
import type { AvailableGame } from "@/hooks/useCharacterForm";

interface CharacterFormImagesTabProps extends CharacterFormTabProps {
  availableGames?: AvailableGame[];
}

function useAiImageSearch(
  form: CharacterFormTabProps["form"],
  field: "main_image_url" | "background_image_url",
  availableGames: AvailableGame[]
) {
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    setLoading(true);
    setError(null);
    setSource(null);

    // Get character name from translations
    const translations = form.getValues("translations") ?? [];
    const name = translations.find((t) => (t.name ?? "").trim())?.name?.trim() ?? "";

    if (!name) {
      setError("noCharacterName");
      setLoading(false);
      return;
    }

    // Resolve game names from selected IDs
    const selectedGames = form.getValues("games") ?? [];
    const gameNames = selectedGames
      .map((g) => availableGames.find((ag) => ag.id === g.game_id)?.title)
      .filter(Boolean) as string[];

    try {
      const res = await fetch("/api/admin/ai-image-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterName: name,
          gameNames: gameNames.length > 0 ? gameNames : undefined,
          imageType: field === "main_image_url" ? "main" : "background",
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      if (data.imageUrl) {
        form.setValue(field, data.imageUrl, { shouldDirty: true });
        setSource(data.source);
      } else {
        setError("noImageFound");
      }
    } catch {
      setError("searchFailed");
    } finally {
      setLoading(false);
    }
  };

  return { search, loading, source, error };
}

export function CharacterFormImagesTab({
  form,
  t,
  availableGames = [],
}: CharacterFormImagesTabProps) {
  const mainImageUrl = form.watch("main_image_url");
  const backgroundImageUrl = form.watch("background_image_url");

  const mainSearch = useAiImageSearch(form, "main_image_url", availableGames);
  const bgSearch = useAiImageSearch(form, "background_image_url", availableGames);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Main image */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="main_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("mainImage")}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      type="url"
                      placeholder={t("mainImagePlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={mainSearch.search}
                    disabled={mainSearch.loading}
                    title={t("aiSearchImage")}
                    className="shrink-0"
                  >
                    {mainSearch.loading ? (
                      <Icon icon="mdi:loading" className="size-4 animate-spin" />
                    ) : (
                      <Icon icon="mdi:auto-fix" className="size-4" />
                    )}
                  </Button>
                </div>
                <FormMessage />
                {mainSearch.error && <p className="text-sm text-red-500">{t(mainSearch.error)}</p>}
                {mainSearch.source && (
                  <p className="text-muted-foreground text-xs">
                    {t("imageSource")}: {mainSearch.source}
                  </p>
                )}
              </FormItem>
            )}
          />
          {mainImageUrl && (
            <div className="relative h-96 rounded-xl border border-gray-200 dark:border-gray-700">
              <Image
                key={mainImageUrl}
                src={mainImageUrl}
                alt="Main image preview"
                fill
                className="rounded-xl object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).parentElement!.style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        {/* Background image */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="background_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("backgroundImage")}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      type="url"
                      placeholder={t("backgroundImagePlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={bgSearch.search}
                    disabled={bgSearch.loading}
                    title={t("aiSearchImage")}
                    className="shrink-0"
                  >
                    {bgSearch.loading ? (
                      <Icon icon="mdi:loading" className="size-4 animate-spin" />
                    ) : (
                      <Icon icon="mdi:auto-fix" className="size-4" />
                    )}
                  </Button>
                </div>
                <FormMessage />
                {bgSearch.error && <p className="text-sm text-red-500">{t(bgSearch.error)}</p>}
                {bgSearch.source && (
                  <p className="text-muted-foreground text-xs">
                    {t("imageSource")}: {bgSearch.source}
                  </p>
                )}
              </FormItem>
            )}
          />
          {backgroundImageUrl && (
            <div
              key={backgroundImageUrl}
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
    </div>
  );
}
