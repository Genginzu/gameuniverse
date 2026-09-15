"use client";

import dynamic from "next/dynamic";

const Icon = dynamic(() => import("@iconify/react").then((mod) => mod.Icon), {
  ssr: false,
  loading: () => <span className="inline-block size-4 sm:size-5" />,
});
import { useTranslations } from "next-intl";

interface FilterButtonProps {
  hasFilters: boolean;
  filterCount: number;
  onClick: () => void;
  /**
   * Visual emphasis. `primary` (default) is the cyan→violet gradient CTA;
   * `secondary` is a lighter accent-outlined button for pages where another
   * action is the main call to action.
   */
  variant?: "primary" | "secondary";
}

const BASE_CLASSES =
  "inline-flex h-12 cursor-pointer items-center rounded-xl px-4 text-sm font-semibold transition-all sm:h-14 sm:px-6 sm:text-base";

const VARIANT_CLASSES: Record<NonNullable<FilterButtonProps["variant"]>, string> = {
  primary:
    "from-palette-secondary-500 to-palette-primary-500 hover:from-palette-secondary-600 hover:to-palette-primary-600 bg-linear-to-r text-white shadow-lg hover:shadow-xl",
  secondary:
    "border-editorial-accent/40 bg-editorial-accent/10 text-editorial-accent hover:bg-editorial-accent/20 border",
};

export function FilterButton({
  hasFilters,
  filterCount,
  onClick,
  variant = "primary",
}: FilterButtonProps) {
  const t = useTranslations("filters");

  return (
    <button onClick={onClick} className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]}`}>
      <Icon icon="mdi:filter-variant" className="size-4 sm:mr-2 sm:size-5" />
      <span className="hidden sm:inline">{t("filter")}</span>
      {hasFilters && (
        <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs sm:ml-2 sm:px-2 sm:text-sm">
          {filterCount}
        </span>
      )}
    </button>
  );
}
