"use client";

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
            <img
              src={mainImageUrl}
              alt="Main image preview"
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
    </div>
  );
}
