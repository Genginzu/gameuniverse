"use client";

import { type UseFormReturn } from "react-hook-form";

import type { AdminCharacterFormData } from "@/lib/validations/admin-character-form";
import { Icon } from "@iconify/react";

/** Hero banner showing main image, name, slug and role */
export function CharacterHeroBanner({
  form,
  t,
}: {
  form: UseFormReturn<AdminCharacterFormData>;
  t: (key: string) => string;
}) {
  const mainImageUrl = form.watch("main_image_url");
  const backgroundImageUrl = form.watch("background_image_url");
  const backgroundColor = form.watch("background_color");
  const name = form.watch("translations.0.name");
  const role = form.watch("translations.0.role");
  const slug = form.watch("slug");

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-gradient-to-br from-gray-900 to-gray-800 shadow-lg dark:border-gray-700/40"
      style={
        backgroundColor
          ? { background: `linear-gradient(135deg, ${backgroundColor}, #1f2937)` }
          : undefined
      }
    >
      {backgroundImageUrl ? (
        <img
          key={backgroundImageUrl}
          src={backgroundImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700/30 via-transparent to-transparent" />
      )}
      <div className="relative z-10 flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:gap-8">
        <div className="flex-shrink-0">
          {mainImageUrl ? (
            <img
              key={mainImageUrl}
              src={mainImageUrl}
              alt="Character"
              className="h-44 w-32 rounded-xl border-2 border-white/20 object-cover shadow-2xl ring-1 ring-black/10"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-44 w-32 items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-sm">
              <Icon icon="fa:user" className="h-8 w-8 text-white/30"  />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 pb-1">
          <p className="truncate text-2xl font-bold text-white drop-shadow-md">
            {name || <span className="italic text-white/40">{t("namePlaceholder")}</span>}
          </p>
          <p className="mt-1 text-sm text-white/50">{slug || "slug"}</p>
          {role && (
            <div className="mt-3">
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80 backdrop-blur-sm">
                {role}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
