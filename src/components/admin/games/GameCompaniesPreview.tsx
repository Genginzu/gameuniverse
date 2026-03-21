"use client";

import { type UseFormReturn } from "react-hook-form";
import { Icon } from "@iconify/react";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import type { Company } from "@/types/admin-games";
import { buildGameColors } from "@/lib/utils/game-utils";

interface GameCompaniesPreviewProps {
  form: UseFormReturn<AdminGameFormData>;
  companies: Company[];
}

/**
 * Live preview of the developer/publisher cards as they appear on the public game page.
 * Watches form companies + color fields and renders a miniature
 * representation matching the GameOverviewSection cards.
 */
export function GameCompaniesPreview({ form, companies }: GameCompaniesPreviewProps) {
  const watchedCompanies = form.watch("companies");
  const bgColorRaw = form.watch("background_color");
  const accentColorRaw = form.watch("accent_color");
  const labelColorRaw = form.watch("label_color");
  const textColorRaw = form.watch("text_color");

  const colors = buildGameColors({
    backgroundColor: bgColorRaw || undefined,
    accentColor: accentColorRaw || undefined,
    labelColor: labelColorRaw || undefined,
    textColor: textColorRaw || undefined,
  });

  const developers = watchedCompanies
    .filter((c) => c.role === "developer")
    .map((c) => companies.find((co) => co.id === c.company_id))
    .filter(Boolean) as Company[];

  const publishers = watchedCompanies
    .filter((c) => c.role === "publisher")
    .map((c) => companies.find((co) => co.id === c.company_id))
    .filter(Boolean) as Company[];

  if (developers.length === 0 && publishers.length === 0) return null;

  return (
    <div className="mb-4">
      <div
        className="overflow-hidden rounded-xl border border-gray-200/60 p-4 dark:border-gray-700/40"
        style={{ backgroundColor: colors.backgroundColor }}
        data-testid="companies-preview"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {developers.length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Icon icon="lucide:users" className="h-4 w-4" style={{ color: colors.accent }} />
                <span className="text-sm" style={{ color: colors.labelColor }}>
                  Développeur
                </span>
              </div>
              <div className="space-y-1">
                {developers.map((dev) => (
                  <div key={dev.id} className="font-medium" style={{ color: colors.textColor }}>
                    {dev.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {publishers.length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Icon icon="lucide:globe" className="h-4 w-4" style={{ color: colors.accent }} />
                <span className="text-sm" style={{ color: colors.labelColor }}>
                  Éditeur
                </span>
              </div>
              <div className="space-y-1">
                {publishers.map((pub) => (
                  <div key={pub.id} className="font-medium" style={{ color: colors.textColor }}>
                    {pub.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
