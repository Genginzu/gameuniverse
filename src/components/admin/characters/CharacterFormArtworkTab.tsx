"use client";

import type { CharacterFormTabProps } from "@/types/admin-characters";
import { CharacterMediaListSection } from "./CharacterMediaListSection";

export function CharacterFormArtworkTab({ form, t }: CharacterFormTabProps) {
  return (
    <div className="space-y-6">
      <CharacterMediaListSection
        form={form}
        t={t}
        mediaType="artwork"
        titleKey="artwork"
        addKey="addArtwork"
        emptyKey="noArtwork"
      />

      {form.formState.errors.media && (
        <p className="text-destructive text-sm font-medium">
          {form.formState.errors.media.message}
        </p>
      )}
    </div>
  );
}
