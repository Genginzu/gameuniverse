"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { CharacterFormTabProps } from "@/types/admin-characters";

export function CharacterFormImagesTab({ form, t }: CharacterFormTabProps) {
  const mainImageUrl = form.watch("main_image_url");
  const backgroundImageUrl = form.watch("background_image_url");

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="main_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("mainImage")}</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder={t("mainImagePlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
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
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="background_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("backgroundImage")}</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder={t("backgroundImagePlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
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
