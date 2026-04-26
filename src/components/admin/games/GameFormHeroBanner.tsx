"use client";

import Image from "next/image";
import { type UseFormReturn } from "react-hook-form";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import type { AdminGenre } from "@/types/admin-games";
import { generateSlugFromTitle } from "@/lib/utils/slug-utils";
import { Icon } from "@iconify/react";

export function HeroBanner({
  form,
  genres,
  coverImageUrl,
  backgroundImageUrl,
  t,
}: {
  form: UseFormReturn<AdminGameFormData>;
  genres: AdminGenre[];
  coverImageUrl: string | undefined;
  backgroundImageUrl: string | undefined;
  t: (key: string) => string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-linear-to-br from-gray-900 to-gray-800 shadow-lg dark:border-gray-700/40">
      {backgroundImageUrl ? (
        <Image
          src={backgroundImageUrl}
          alt=""
          fill
          className="object-cover opacity-40"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-gray-700/30 via-transparent to-transparent" />
      )}
      <div className="relative z-10 flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:gap-8">
        <div className="shrink-0">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt="Cover"
              width={128}
              height={176}
              className="h-44 w-32 rounded-xl border-2 border-white/20 object-cover shadow-2xl ring-1 ring-black/10"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-44 w-32 items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-xs">
              <Icon icon="fa:image" className="h-8 w-8 text-white/30" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 pb-1">
          <p className="truncate text-2xl font-bold text-white drop-shadow-md">
            {form.watch("translations.0.title") || (
              <span className="text-white/40 italic">{t("titlePlaceholder")}</span>
            )}
          </p>
          <p className="mt-1 text-sm text-white/50">
            {form.watch("slug") ||
              generateSlugFromTitle(form.watch("translations.0.title") || "") ||
              "slug"}
            {form.watch("release_date") && (
              <span className="ml-3">· {new Date(form.watch("release_date")!).getFullYear()}</span>
            )}
          </p>
          {form.watch("genres").length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {form.watch("genres").map((g) => {
                const genre = genres.find((gn) => gn.id === g.genre_id);
                return genre ? (
                  <span
                    key={g.genre_id}
                    className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80 backdrop-blur-xs"
                  >
                    {genre.name}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
