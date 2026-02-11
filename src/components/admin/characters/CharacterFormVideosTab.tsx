"use client";

import type { CharacterFormTabProps } from "@/types/admin-characters";
import { CharacterMediaListSection } from "./CharacterMediaListSection";

export function CharacterFormVideosTab({ form, t }: CharacterFormTabProps) {
  return (
    <div className="space-y-6">
      <CharacterMediaListSection
        form={form}
        t={t}
        mediaType="video"
        titleKey="videos"
        addKey="addVideo"
        emptyKey="noVideos"
        showThumbnail
      />

      {form.formState.errors.media && (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.media.message}
        </p>
      )}
    </div>
  );
}
