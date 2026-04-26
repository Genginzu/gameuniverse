"use client";

import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { GameFormTabProps } from "@/types/admin-games";

/** Admin form tab for game music/soundtrack data */
export function GameFormMusicTab({ form, t }: GameFormTabProps) {
  return (
    <div className="space-y-5">
      <FormField
        control={form.control}
        name="music_composer"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("musicComposer")}</FormLabel>
            <FormControl>
              <Input
                placeholder="ex: Nobuo Uematsu, Koji Kondo..."
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="music_spotify_embed_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("musicSpotifyUrl")}</FormLabel>
            <FormControl>
              <Input
                type="url"
                placeholder="https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <p className="text-muted-foreground text-xs">{t("musicSpotifyHint")}</p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="music_youtube_video_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("musicYoutubeUrl")}</FormLabel>
            <FormControl>
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
