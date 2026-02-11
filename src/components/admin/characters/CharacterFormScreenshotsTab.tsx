"use client";

import type { CharacterFormTabProps } from "@/types/admin-characters";
import { CharacterMediaListSection } from "./CharacterMediaListSection";

export function CharacterFormScreenshotsTab({ form, t }: CharacterFormTabProps) {
  return (
    <div className="space-y-6">
      <CharacterMediaListSection
        form={form}
        t={t}
        mediaType="screenshot"
        titleKey="screenshots"
        addKey="addScreenshot"
        emptyKey="noScreenshots"
      />

      {form.formState.errors.media && (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.media.message}
        </p>
      )}
    </div>
  );
}
